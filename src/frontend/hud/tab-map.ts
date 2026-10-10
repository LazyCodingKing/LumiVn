import type { LedgerData, PlaceRoute, PlaceNode, AssetManifest, RosterCharacter } from "../../shared/types.js";

export class MapTab {
  public root: HTMLElement;
  private onAction: (actionText: string) => void;
  private viewMode: "indoor" | "outdoor" = "indoor";
  private manifest?: AssetManifest;

  // Pan & Zoom state
  private zoom = 1.0;
  private panX = 0;
  private panY = 0;
  private isPanning = false;
  private startPointerX = 0;
  private startPointerY = 0;
  private selectedNodeId: string | null = null;

  constructor(onAction: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-map";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    if (manifest) this.manifest = manifest;
    this.root.innerHTML = "";
    const currentPlace = (ledger.scene?.place || "default").toLowerCase();
    const isIndoor = currentPlace.includes(":") || currentPlace.includes("residence") || currentPlace.includes("dojo") || currentPlace.includes("room") || currentPlace.includes("foyer");
    
    // Default to matching mode if not manually changed
    if (!this.selectedNodeId) {
      this.viewMode = isIndoor ? "indoor" : "outdoor";
      this.selectedNodeId = currentPlace;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 10px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>🗺️</span> <span>Interactive Cartography & Blueprint</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            <span>⏱️ <strong>${ledger.clock?.t || "D1 12:00"}</strong> (${ledger.clock?.phase || "Day"})</span>
            ${ledger.clock?.date ? `<span> • 📅 ${ledger.clock.date}</span>` : ""}
            <span> • 📍 <span style="color:#38bdf8; font-weight: 600;">${currentPlace}</span></span>
          </p>
        </div>
        <div style="display: flex; gap: 6px; align-items: center;">
          <div style="background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 2px; display: flex;">
            <button id="vn-map-indoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "indoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              🏠 Blueprint
            </button>
            <button id="vn-map-outdoor-btn" class="vn-btn vn-btn-sm" style="border: none; border-radius: 4px; padding: 4px 10px; font-size: 11px; cursor: pointer; ${this.viewMode === "outdoor" ? "background: #6366f1; color: #fff; font-weight: 600;" : "background: transparent; color: #94a3b8;"}">
              🌐 District
            </button>
          </div>
          <div style="display: flex; gap: 3px;">
            <button id="vn-map-zoom-in" title="Zoom In" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; width: 28px; height: 28px; font-weight: bold; cursor: pointer;">+</button>
            <button id="vn-map-zoom-out" title="Zoom Out" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; width: 28px; height: 28px; font-weight: bold; cursor: pointer;">−</button>
            <button id="vn-map-zoom-reset" title="Reset View" style="background: #1e293b; border: 1px solid #475569; color: #cbd5e1; border-radius: 4px; padding: 0 8px; height: 28px; font-size: 11px; cursor: pointer;">⟲</button>
          </div>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    header.querySelector("#vn-map-indoor-btn")?.addEventListener("click", () => {
      this.viewMode = "indoor";
      this.resetView();
      this.render(ledger);
    });
    header.querySelector("#vn-map-outdoor-btn")?.addEventListener("click", () => {
      this.viewMode = "outdoor";
      this.resetView();
      this.render(ledger);
    });
    header.querySelector("#vn-map-zoom-in")?.addEventListener("click", () => this.adjustZoom(1.25));
    header.querySelector("#vn-map-zoom-out")?.addEventListener("click", () => this.adjustZoom(0.8));
    header.querySelector("#vn-map-zoom-reset")?.addEventListener("click", () => {
      this.resetView();
      this.updateTransform();
    });

    // Main map container layout: Canvas viewport + Details sidebar
    const mainLayout = document.createElement("div");
    mainLayout.style.cssText = "display: flex; gap: 12px; height: 420px; min-height: 400px; position: relative;";

    const viewportWrap = document.createElement("div");
    viewportWrap.id = "vn-map-viewport";
    viewportWrap.style.cssText = "flex: 1; background: #070d19; border: 1px solid #1e293b; border-radius: 10px; overflow: hidden; position: relative; cursor: grab; user-select: none;";

    const sidebar = document.createElement("div");
    sidebar.id = "vn-map-sidebar";
    sidebar.style.cssText = "width: 280px; background: #0f172a; border: 1px solid #334155; border-radius: 10px; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; box-sizing: border-box;";

    mainLayout.appendChild(viewportWrap);
    mainLayout.appendChild(sidebar);
    this.root.appendChild(mainLayout);

    this.renderGraph(viewportWrap, ledger, currentPlace);
    this.renderSidebar(sidebar, ledger, currentPlace);
    this.setupPanZoom(viewportWrap);
  }

  private resetView(): void {
    this.zoom = 1.0;
    this.panX = 0;
    this.panY = 0;
  }

  private adjustZoom(factor: number): void {
    this.zoom = Math.max(0.4, Math.min(3.0, this.zoom * factor));
    this.updateTransform();
  }

  private updateTransform(): void {
    const group = this.root.querySelector("#vn-map-svg-group") as SVGGraphicsElement | null;
    if (group) {
      group.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    }
  }

  private setupPanZoom(viewport: HTMLElement): void {
    viewport.addEventListener("pointerdown", (e) => {
      if ((e.target as HTMLElement).closest(".vn-map-node-interactive")) return;
      this.isPanning = true;
      this.startPointerX = e.clientX - this.panX;
      this.startPointerY = e.clientY - this.panY;
      viewport.style.cursor = "grabbing";
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startPointerX;
      this.panY = e.clientY - this.startPointerY;
      this.updateTransform();
    });

    const endPan = (e: PointerEvent) => {
      if (!this.isPanning) return;
      this.isPanning = false;
      viewport.style.cursor = "grab";
      try { viewport.releasePointerCapture(e.pointerId); } catch {}
    };

    viewport.addEventListener("pointerup", endPan);
    viewport.addEventListener("pointercancel", endPan);

    viewport.addEventListener("wheel", (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
      this.adjustZoom(zoomFactor);
    }, { passive: false });
  }

  private renderGraph(viewport: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    viewport.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    svg.style.display = "block";

    // Blueprint grid pattern definition
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `
      <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" stroke-width="0.8" stroke-opacity="0.4"/>
        <circle cx="0" cy="0" r="1.5" fill="#334155" opacity="0.6"/>
      </pattern>
      <linearGradient id="corridor-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#818cf8" stop-opacity="0.6"/>
      </linearGradient>
    `;
    svg.appendChild(defs);

    // Background rect with grid
    const bgRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bgRect.setAttribute("width", "100%");
    bgRect.setAttribute("height", "100%");
    bgRect.setAttribute("fill", "url(#grid-pattern)");
    svg.appendChild(bgRect);

    // Dynamic zoomable group
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = "vn-map-svg-group";
    g.setAttribute("transform", `translate(${this.panX}, ${this.panY}) scale(${this.zoom})`);
    svg.appendChild(g);

    if (this.viewMode === "indoor") {
      this.renderIndoorSvg(g, ledger, currentPlace);
    } else {
      this.renderOutdoorSvg(g, ledger, currentPlace);
    }

    viewport.appendChild(svg);
  }

  private renderIndoorSvg(group: SVGGElement, ledger: LedgerData, currentPlace: string): void {
    const scopePrefix = currentPlace.includes(":") ? currentPlace.split(":")[0]! : "building";
    const currentRoom = currentPlace.replace(/^@/, "").includes(":") ? currentPlace.replace(/^@/, "").split(":")[1]! : currentPlace.replace(/^@/, "");

    // Collect rooms
    const knownPlaces = Object.keys(ledger.places || {});
    const indoorKeys = knownPlaces.filter((p) => p.replace(/^@/, "").startsWith(`${scopePrefix}:`) || !p.includes(":"));
    const rawKeys = indoorKeys.length > 0
      ? indoorKeys
      : ["entrance", "living_room", "kitchen", "hallway", "bedroom", "courtyard", "bathroom"];

    // Layout nodes in a blueprint coordinate scheme
    interface RoomLayout {
      id: string;
      cleanName: string;
      x: number;
      y: number;
      w: number;
      h: number;
    }

    const layouts: RoomLayout[] = [];
    const cols = 3;
    const roomW = 160;
    const roomH = 95;
    const gapX = 50;
    const gapY = 40;
    const startX = 60;
    const startY = 40;

    rawKeys.forEach((key, idx) => {
      const clean = key.replace(/^@/, "").includes(":") ? key.replace(/^@/, "").split(":")[1]! : key.replace(/^@/, "");
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      layouts.push({
        id: key,
        cleanName: clean,
        x: startX + c * (roomW + gapX),
        y: startY + r * (roomH + gapY),
        w: roomW,
        h: roomH,
      });
    });

    // Draw connecting corridor paths between adjacent rooms
    for (let i = 0; i < layouts.length; i++) {
      for (let j = i + 1; j < layouts.length; j++) {
        const r1 = layouts[i]!;
        const r2 = layouts[j]!;
        const dx = Math.abs(r1.x - r2.x);
        const dy = Math.abs(r1.y - r2.y);
        if ((dx <= roomW + gapX + 10 && dy === 0) || (dy <= roomH + gapY + 10 && dx === 0)) {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "line");
          path.setAttribute("x1", String(r1.x + r1.w / 2));
          path.setAttribute("y1", String(r1.y + r1.h / 2));
          path.setAttribute("x2", String(r2.x + r2.w / 2));
          path.setAttribute("y2", String(r2.y + r2.h / 2));
          path.setAttribute("stroke", "#334155");
          path.setAttribute("stroke-width", "8");
          path.setAttribute("stroke-linecap", "round");
          group.appendChild(path);
        }
      }
    }

    // Render Room Boxes and NPC Presence Tokens
    layouts.forEach((room) => {
      const isHere = room.cleanName.toLowerCase() === currentRoom.toLowerCase() || room.id === currentPlace;
      const isSelected = room.id === this.selectedNodeId;
      const placeConfig = (ledger.places?.[room.id] || {}) as PlaceNode;

      // Check route gating if coming from current place
      const currentRoutes = (ledger.places?.[currentPlace]?.routes || []) as PlaceRoute[];
      const routeToThis = currentRoutes.find((r) => typeof r === "object" && r.to === room.id);
      const isLocked = Boolean(routeToThis?.why_not || (routeToThis?.requires && Object.keys(routeToThis.requires).length > 0));

      const roomG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      roomG.setAttribute("class", "vn-map-node-interactive");
      roomG.style.cursor = "pointer";

      // Rect
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", String(room.x));
      rect.setAttribute("y", String(room.y));
      rect.setAttribute("width", String(room.w));
      rect.setAttribute("height", String(room.h));
      rect.setAttribute("rx", "8");
      rect.setAttribute("fill", isHere ? "rgba(56, 189, 248, 0.16)" : isSelected ? "rgba(99, 102, 241, 0.22)" : "#0f172a");
      rect.setAttribute("stroke", isHere ? "#38bdf8" : isSelected ? "#818cf8" : isLocked ? "#f43f5e" : "#334155");
      rect.setAttribute("stroke-width", isHere || isSelected ? "2.5" : "1.5");
      rect.setAttribute("stroke-dasharray", isLocked ? "4 3" : "none");
      roomG.appendChild(rect);

      // Title
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("x", String(room.x + 12));
      text.setAttribute("y", String(room.y + 24));
      text.setAttribute("fill", isHere ? "#38bdf8" : "#f1f5f9");
      text.setAttribute("font-size", "12");
      text.setAttribute("font-weight", "700");
      text.textContent = (room.cleanName.replace(/_/g, " ")).toUpperCase();
      roomG.appendChild(text);

      // Room type / privacy hint
      const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
      sub.setAttribute("x", String(room.x + 12));
      sub.setAttribute("y", String(room.y + 38));
      sub.setAttribute("fill", "#64748b");
      sub.setAttribute("font-size", "9");
      sub.textContent = placeConfig.norm || (isLocked ? `🔒 ${routeToThis?.why_not || "Restricted"}` : "Interior Zone");
      roomG.appendChild(sub);

      // Presence badges
      const npcsInRoom = (ledger.roster || []).filter((r) =>
        (r.loc || "").toLowerCase().includes(room.cleanName.toLowerCase())
      );

      let tokenOffset = 0;
      if (isHere) {
        // Player badge
        const playerBadge = this.createPresenceToken(room.x + 12 + tokenOffset, room.y + room.h - 22, "YOU", "#0284c7", "#fff");
        roomG.appendChild(playerBadge);
        tokenOffset += 42;
      }

      npcsInRoom.forEach((npc) => {
        if (tokenOffset < room.w - 40) {
          const npcBadge = this.createPresenceToken(room.x + 12 + tokenOffset, room.y + room.h - 22, (npc.name || npc.id).slice(0, 5), "#4f46e5", "#c7d2fe");
          roomG.appendChild(npcBadge);
          tokenOffset += 44;
        }
      });

      roomG.addEventListener("click", () => {
        this.selectedNodeId = room.id;
        this.render(ledger);
      });

      group.appendChild(roomG);
    });
  }

  private renderOutdoorSvg(group: SVGGElement, ledger: LedgerData, currentPlace: string): void {
    const places = ledger.places || {};
    const placeKeys = Object.keys(places);

    const outdoorKeys = placeKeys.length > 0
      ? placeKeys
      : ["nerima_district", "tendo_dojo", "furinkan_high", "cat_cafe", "shopping_district", "park"];

    // Distribute nodes in a pleasant circular or multi-hub cartography layout
    interface NodePos {
      id: string;
      x: number;
      y: number;
    }

    const nodes: NodePos[] = [];
    const centerX = 320;
    const centerY = 200;
    const radius = 140;

    outdoorKeys.forEach((key, idx) => {
      if (idx === 0) {
        nodes.push({ id: key, x: centerX, y: centerY });
      } else {
        const angle = ((idx - 1) / (outdoorKeys.length - 1)) * 2 * Math.PI;
        nodes.push({
          id: key,
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
        });
      }
    });

    const nodeMap = new Map<string, NodePos>(nodes.map((n) => [n.id, n]));

    // Draw route paths
    nodes.forEach((source) => {
      const routes = (places[source.id]?.routes || []) as PlaceRoute[];
      routes.forEach((route) => {
        const destId = typeof route === "object" && route.to ? route.to : String(route);
        const target = nodeMap.get(destId);
        if (target) {
          const isGated = typeof route === "object" && Boolean(route.why_not || route.requires);
          const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          line.setAttribute("x1", String(source.x));
          line.setAttribute("y1", String(source.y));
          line.setAttribute("x2", String(target.x));
          line.setAttribute("y2", String(target.y));
          line.setAttribute("stroke", isGated ? "#f43f5e" : "#3b82f6");
          line.setAttribute("stroke-width", "2");
          line.setAttribute("stroke-dasharray", isGated ? "5 3" : "none");
          line.setAttribute("opacity", "0.6");
          group.appendChild(line);

          // Route minute badge on midpoint
          if (typeof route === "object" && route.minutes) {
            const mx = (source.x + target.x) / 2;
            const my = (source.y + target.y) / 2;
            const pill = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            pill.setAttribute("x", String(mx - 18));
            pill.setAttribute("y", String(my - 9));
            pill.setAttribute("width", "36");
            pill.setAttribute("height", "18");
            pill.setAttribute("rx", "4");
            pill.setAttribute("fill", "#0f172a");
            pill.setAttribute("stroke", "#334155");
            group.appendChild(pill);

            const minTxt = document.createElementNS("http://www.w3.org/2000/svg", "text");
            minTxt.setAttribute("x", String(mx));
            minTxt.setAttribute("y", String(my + 4));
            minTxt.setAttribute("fill", "#94a3b8");
            minTxt.setAttribute("font-size", "9");
            minTxt.setAttribute("text-anchor", "middle");
            minTxt.textContent = `${route.minutes}m`;
            group.appendChild(minTxt);
          }
        }
      });
    });

    // Draw Nodes
    nodes.forEach((node) => {
      const isHere = node.id.toLowerCase() === currentPlace.toLowerCase();
      const isSelected = node.id === this.selectedNodeId;
      const npcs = (ledger.roster || []).filter((r) => (r.loc || "").toLowerCase().includes(node.id.toLowerCase()));

      const nodeG = document.createElementNS("http://www.w3.org/2000/svg", "g");
      nodeG.setAttribute("class", "vn-map-node-interactive");
      nodeG.style.cursor = "pointer";

      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", String(node.x));
      circle.setAttribute("cy", String(node.y));
      circle.setAttribute("r", "34");
      circle.setAttribute("fill", isHere ? "rgba(56, 189, 248, 0.2)" : isSelected ? "rgba(99, 102, 241, 0.25)" : "#0f172a");
      circle.setAttribute("stroke", isHere ? "#38bdf8" : isSelected ? "#818cf8" : "#334155");
      circle.setAttribute("stroke-width", isHere || isSelected ? "3" : "1.5");
      nodeG.appendChild(circle);

      const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      label.setAttribute("x", String(node.x));
      label.setAttribute("y", String(node.y + 4));
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("fill", isHere ? "#38bdf8" : "#f8fafc");
      label.setAttribute("font-size", "10");
      label.setAttribute("font-weight", "700");
      label.textContent = node.id.replace(/_/g, " ").slice(0, 12);
      nodeG.appendChild(label);

      if (isHere) {
        const youBadge = this.createPresenceToken(node.x - 18, node.y - 28, "YOU", "#0284c7", "#fff");
        nodeG.appendChild(youBadge);
      }

      if (npcs.length > 0) {
        const countBadge = this.createPresenceToken(node.x - 16, node.y + 14, `👥 ${npcs.length}`, "#4338ca", "#c7d2fe");
        nodeG.appendChild(countBadge);
      }

      nodeG.addEventListener("click", () => {
        this.selectedNodeId = node.id;
        this.render(ledger);
      });

      group.appendChild(nodeG);
    });
  }

  private createPresenceToken(x: number, y: number, textStr: string, bg: string, fg: string): SVGGElement {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const width = Math.max(32, textStr.length * 7 + 10);
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", String(x));
    rect.setAttribute("y", String(y));
    rect.setAttribute("width", String(width));
    rect.setAttribute("height", "15");
    rect.setAttribute("rx", "4");
    rect.setAttribute("fill", bg);
    rect.setAttribute("stroke", "rgba(255,255,255,0.2)");
    rect.setAttribute("stroke-width", "0.5");
    g.appendChild(rect);

    const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
    txt.setAttribute("x", String(x + width / 2));
    txt.setAttribute("y", String(y + 11));
    txt.setAttribute("fill", fg);
    txt.setAttribute("font-size", "9");
    txt.setAttribute("font-weight", "800");
    txt.setAttribute("text-anchor", "middle");
    txt.textContent = textStr;
    g.appendChild(txt);

    return g;
  }

  private renderSidebar(sidebar: HTMLElement, ledger: LedgerData, currentPlace: string): void {
    sidebar.innerHTML = "";
    const selected = this.selectedNodeId || currentPlace;
    const cleanName = selected.replace(/^@/, "").includes(":") ? selected.replace(/^@/, "").split(":")[1]! : selected.replace(/^@/, "");
    const placeConfig = (ledger.places?.[selected] || {}) as PlaceNode;
    const isHere = selected.toLowerCase() === currentPlace.toLowerCase() || cleanName.toLowerCase() === currentPlace.toLowerCase();

    // Check routing gating
    const currentRoutes = (ledger.places?.[currentPlace]?.routes || []) as PlaceRoute[];
    const route = currentRoutes.find((r) => typeof r === "object" && (r.to === selected || r.to === cleanName || (typeof r.to === "string" && r.to.replace(/^@/, "") === cleanName)));
    const isGated = Boolean(route?.why_not || (route?.requires && Object.keys(route.requires).length > 0));
    const whyNot = route?.why_not;

    const placeThumbnail =
      this.manifest?.places?.[selected] ||
      this.manifest?.places?.[cleanName] ||
      this.manifest?.places?.[selected.replace(/^@/, "")] ||
      this.manifest?.places?.[selected.toLowerCase()] ||
      this.manifest?.places?.[cleanName.toLowerCase()] ||
      "";

    const npcsHere = (ledger.roster || []).filter((r: RosterCharacter) => {
      const loc = (r.loc || "").toLowerCase();
      return (
        loc === selected.toLowerCase() ||
        loc === cleanName.toLowerCase() ||
        loc.includes(cleanName.toLowerCase())
      );
    });

    const inv: any = (ledger as any).inventory || ledger.actors?.["user"]?.inventory;
    const invRoomLoc = inv?.room_location?.toLowerCase();
    const isMatchingRoom = isHere || (invRoomLoc && (invRoomLoc === selected.toLowerCase() || invRoomLoc.includes(cleanName.toLowerCase())));
    const roomItems: string[] = [
      ...(Array.isArray((placeConfig as any).items) ? ((placeConfig as any).items as string[]) : []),
      ...(Array.isArray((placeConfig as any).objects) ? ((placeConfig as any).objects as string[]) : []),
      ...(isMatchingRoom && Array.isArray(inv?.room) ? (inv.room as string[]) : []),
    ];
    const uniqueRoomItems = [...new Set(roomItems)];

    const getRoomItemIcon = (name: string): string => {
      const n = name.toLowerCase();
      if (n.includes("key") || n.includes("card") || n.includes("pass")) return "🔑";
      if (n.includes("knife") || n.includes("blade") || n.includes("sword") || n.includes("gun")) return "🗡️";
      if (n.includes("phone") || n.includes("pager") || n.includes("radio")) return "📱";
      if (n.includes("note") || n.includes("paper") || n.includes("book") || n.includes("file") || n.includes("journal")) return "📜";
      if (n.includes("food") || n.includes("bread") || n.includes("ration")) return "🥪";
      if (n.includes("drink") || n.includes("coffee") || n.includes("tea") || n.includes("water") || n.includes("bottle")) return "☕";
      return "📦";
    };

    sidebar.innerHTML = `
      ${placeThumbnail ? `
        <div style="width: 100%; height: 110px; border-radius: 8px; overflow: hidden; margin-bottom: 8px; border: 1px solid #334155; position: relative; background: #070d19;">
          <img src="${placeThumbnail}" style="width: 100%; height: 100%; object-fit: cover;" alt="${cleanName}" />
        </div>
      ` : ''}
      <div style="border-bottom: 1px solid #334155; padding-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h4 style="margin: 0; font-size: 13px; color: #38bdf8; text-transform: uppercase;">
            ${cleanName.replace(/_/g, " ")}
          </h4>
          ${isHere ? '<span style="font-size: 10px; background: #0284c7; color: #fff; padding: 2px 6px; border-radius: 4px; font-weight: 700;">CURRENT</span>' : ''}
        </div>
        <p style="margin: 2px 0 0 0; font-size: 11px; color: #94a3b8;">${placeConfig.norm || (placeConfig.indoors ? "Indoor Facility" : "Public District")}</p>
      </div>

      ${isGated ? `
        <div style="background: rgba(244, 63, 94, 0.15); border: 1px solid #f43f5e; border-radius: 6px; padding: 8px; font-size: 11px; color: #fda4af;">
          <strong>🔒 Access Restricted:</strong>
          <div style="margin-top: 3px;">${whyNot || "Requirements not met."}</div>
        </div>
      ` : ''}

      <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px; color: #cbd5e1;">
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">Privacy / Traffic:</span>
          <span>${placeConfig.privacy ?? "—"} / ${placeConfig.traffic ?? "—"}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #94a3b8;">Visibility:</span>
          <span>${placeConfig.visibility ?? "—"}</span>
        </div>
        ${placeConfig.occ ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Occupancy:</span>
            <span style="color: #38bdf8; font-weight: 600;">${placeConfig.occ}</span>
          </div>
        ` : ''}
        ${placeConfig.population ? `
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #94a3b8;">Population:</span>
            <span>${placeConfig.population}</span>
          </div>
        ` : ''}
        ${Array.isArray(placeConfig.cohorts) && placeConfig.cohorts.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 2px; margin-top: 2px;">
            <span style="color: #94a3b8;">Active Cohorts:</span>
            <div style="display: flex; flex-wrap: wrap; gap: 3px;">
              ${placeConfig.cohorts.map((c: string) => `<span style="background: rgba(148, 163, 184, 0.15); border: 1px solid #475569; padding: 1px 5px; border-radius: 4px; font-size: 10px; color: #cbd5e1;">👥 ${c}</span>`).join("")}
            </div>
          </div>
        ` : ''}
      </div>

      ${Array.isArray(placeConfig.affordances) && placeConfig.affordances.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Affordances ${isHere ? '<span style="color: #38bdf8;">(Click to interact)</span>' : ''}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.affordances.map((a: string) => `
              <span class="${isHere ? "vn-affordance-interactive" : ""}" data-affordance="${a}" style="background: #1e293b; border: 1px solid ${isHere ? "#38bdf8" : "#475569"}; padding: 2px 6px; border-radius: 4px; font-size: 10px; ${isHere ? "cursor: pointer; color: #93c5fd;" : ""}">${a}</span>
            `).join("")}
          </div>
        </div>
      ` : ''}

      ${isHere || uniqueRoomItems.length > 0 ? `
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-size: 10px; color: #38bdf8; text-transform: uppercase; font-weight: 700;">📦 Room Objects (${uniqueRoomItems.length})</span>
            ${isHere ? `<button class="vn-search-room-btn" style="background: rgba(56, 189, 248, 0.15); border: 1px solid #38bdf8; color: #38bdf8; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">🔍 Search Room</button>` : ''}
          </div>
          <div style="display: flex; flex-direction: column; gap: 4px;">
            ${uniqueRoomItems.length > 0
              ? uniqueRoomItems.map((item) => `
                <div style="background: #1e293b; padding: 4px 8px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 6px; border: 1px solid #334155;">
                  <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                    <span>${getRoomItemIcon(item)}</span>
                    <span style="color: #f8fafc; font-weight: 600; text-overflow: ellipsis; overflow: hidden; white-space: nowrap;">${item}</span>
                  </div>
                  <div style="display: flex; gap: 4px; flex-shrink: 0;">
                    <button class="vn-take-item-btn" data-item="${item}" style="background: #059669; border: none; color: #fff; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">Take</button>
                    <button class="vn-inspect-item-btn" data-item="${item}" style="background: #334155; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer;">Examine</button>
                  </div>
                </div>
              `).join("")
              : '<span style="color: #64748b; font-size: 11px; font-style: italic;">No loose items seen here.</span>'
            }
          </div>
        </div>
      ` : ''}

      ${Array.isArray(placeConfig.hazards) && placeConfig.hazards.length > 0 ? `
        <div>
          <div style="font-size: 10px; color: #f59e0b; text-transform: uppercase; margin-bottom: 4px;">⚠️ Hazards</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${placeConfig.hazards.map((h: string) => `<span style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; padding: 2px 6px; border-radius: 4px; font-size: 10px; color: #fcd34d;">${h}</span>`).join("")}
          </div>
        </div>
      ` : ''}

      <div>
        <div style="font-size: 10px; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px;">Present Cast (${npcsHere.length})</div>
        <div style="display: flex; flex-direction: column; gap: 4px;">
          ${npcsHere.length > 0
            ? npcsHere.map((n) => {
                const normId = (n.id || "").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
                const charData = this.manifest?.characters?.[normId];
                const outfits = charData?.outfits || (charData as any);
                const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
                const avatar = defaultSet?.["neutral"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
                const focus = charData?.avatarFocus || { x: 50, y: 15 };
                return `
                  <div style="background: #1e293b; padding: 4px 8px; border-radius: 6px; font-size: 11px; display: flex; align-items: center; justify-content: space-between; gap: 6px;">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      ${avatar ? `<img src="${avatar}" style="width: 18px; height: 18px; border-radius: 50%; object-fit: cover; object-position: ${focus.x ?? 50}% ${focus.y ?? 15}%;" alt="" />` : '<span>👤</span>'}
                      <span style="color: #c7d2fe; font-weight: 600;">${n.name || n.id}</span>
                    </div>
                    <span style="color: #94a3b8; font-size: 10px;">${n.posture || n.activity || "Idle"}</span>
                  </div>
                `;
              }).join("")
            : '<span style="color: #64748b; font-size: 11px;">No detected actors</span>'
          }
        </div>
      </div>

      <div style="margin-top: auto; padding-top: 10px;">
        ${!isHere ? `
          <button id="vn-sidebar-navigate-btn" class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; font-weight: 700; ${isGated ? "background: #475569; cursor: not-allowed; opacity: 0.7;" : "background: #6366f1; cursor: pointer;"}" ${isGated ? "disabled" : ""}>
            ${isGated ? "🔒 Travel Gated" : `Travel to ${cleanName.replace(/_/g, " ")}`}
          </button>
        ` : `
          <button class="vn-btn" style="width: 100%; padding: 8px; font-size: 12px; background: #0284c7; cursor: default;" disabled>
            ✓ Already Present Here
          </button>
        `}
      </div>
    `;

    sidebar.querySelector("#vn-sidebar-navigate-btn")?.addEventListener("click", () => {
      if (isGated) return;
      this.onAction(`*Travels to the ${cleanName.replace(/_/g, " ")}*`);
    });

    sidebar.querySelectorAll<HTMLButtonElement>(".vn-take-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.dataset.item;
        if (item) this.onAction(`*Picks up ${item} from the ${cleanName.replace(/_/g, " ")}*`);
      });
    });

    sidebar.querySelectorAll<HTMLButtonElement>(".vn-inspect-item-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = btn.dataset.item;
        if (item) this.onAction(`*Examines ${item} in the ${cleanName.replace(/_/g, " ")}*`);
      });
    });

    sidebar.querySelector(".vn-search-room-btn")?.addEventListener("click", () => {
      this.onAction(`*Searches the ${cleanName.replace(/_/g, " ")} for items and clues*`);
    });

    sidebar.querySelectorAll<HTMLElement>(".vn-affordance-interactive").forEach((el) => {
      el.addEventListener("click", () => {
        const aff = el.dataset.affordance;
        if (aff) this.onAction(`*Interacts with the ${aff.toLowerCase()} in the ${cleanName.replace(/_/g, " ")}*`);
      });
    });
  }
}
