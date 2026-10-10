import type { AssetManifest, AssetLibraryItem } from "../../shared/types.js";

export interface AssetPickerOptions {
  manifest?: AssetManifest;
  title?: string;
  category?: string; // "characters" | "places" | "all"
  onSelect: (item: AssetLibraryItem) => void;
}

export function openAssetPicker(options: AssetPickerOptions): void {
  // 1. Gather all assets
  const items: AssetLibraryItem[] = [];
  const seenUrls = new Set<string>();

  if (options.manifest?.library) {
    for (const item of options.manifest.library) {
      if (item.url && !seenUrls.has(item.url)) {
        items.push(item);
        seenUrls.add(item.url);
      }
    }
  }

  // Fallback scan places & characters if library list had missing items
  if (options.manifest?.places) {
    for (const [key, url] of Object.entries(options.manifest.places)) {
      if (url && !seenUrls.has(url)) {
        items.push({
          id: `place_${key}`,
          name: `📍 ${key}`,
          url,
          category: "places",
          placeId: key,
          uploadedAt: new Date().toISOString(),
        });
        seenUrls.add(url);
      }
    }
  }

  if (options.manifest?.characters) {
    for (const [actorId, actorData] of Object.entries(options.manifest.characters)) {
      if (!actorData || typeof actorData !== "object") continue;
      const outfits = actorData.outfits || (actorData as any);
      if (outfits && typeof outfits === "object") {
        for (const [outfit, exprs] of Object.entries(outfits)) {
          if (exprs && typeof exprs === "object") {
            for (const [expr, url] of Object.entries(exprs as Record<string, string>)) {
              if (url && typeof url === "string" && !seenUrls.has(url)) {
                items.push({
                  id: `char_${actorId}_${outfit}_${expr}`,
                  name: `👤 ${actorId} (${outfit}/${expr})`,
                  url,
                  category: "characters",
                  actorId,
                  outfit,
                  expression: expr,
                  uploadedAt: new Date().toISOString(),
                });
                seenUrls.add(url);
              }
            }
          }
        }
      }
      if (actorData.actions) {
        for (const [act, url] of Object.entries(actorData.actions)) {
          if (url && typeof url === "string" && !seenUrls.has(url)) {
            items.push({
              id: `act_${actorId}_${act}`,
              name: `⚡ ${actorId} [${act}]`,
              url,
              category: "actions",
              actorId,
              uploadedAt: new Date().toISOString(),
            });
            seenUrls.add(url);
          }
        }
      }
    }
  }

  // 2. Render Modal
  const modalOverlay = document.createElement("div");
  modalOverlay.className = "vn-asset-picker-overlay";
  modalOverlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(2, 6, 23, 0.75);
    backdrop-filter: blur(4px);
    z-index: 100000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-sizing: border-box;
  `;

  const modalBox = document.createElement("div");
  modalBox.style.cssText = `
    background: #0f172a;
    border: 1px solid #38bdf8;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.6);
    width: 600px;
    max-width: 90vw;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  `;

  const close = () => {
    if (modalOverlay.parentElement) {
      modalOverlay.parentElement.removeChild(modalOverlay);
    }
  };

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) close();
  });

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 12px 16px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <div>
      <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 8px;">
        <span>🖼️</span> <span>${options.title || "Reusable Asset Library"}</span>
      </h3>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        ${items.length} saved asset${items.length === 1 ? "" : "s"} ready to assign
      </div>
    </div>
    <button id="vn-picker-close-btn" style="background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px;">✕</button>
  `;
  header.querySelector("#vn-picker-close-btn")?.addEventListener("click", close);
  modalBox.appendChild(header);

  // Filter Bar
  let activeFilter: string = options.category || "all";
  const filterBar = document.createElement("div");
  filterBar.style.cssText = `
    padding: 8px 16px;
    background: #0b1120;
    border-bottom: 1px solid #1e293b;
    display: flex;
    gap: 8px;
    align-items: center;
  `;

  const renderFilterButtons = () => {
    filterBar.innerHTML = `
      <span style="font-size: 11px; color: #64748b;">Filter:</span>
      <button class="vn-picker-filter-btn" data-filter="all" style="background: ${activeFilter === "all" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "all" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "all" ? "700" : "500"};">All (${items.length})</button>
      <button class="vn-picker-filter-btn" data-filter="characters" style="background: ${activeFilter === "characters" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "characters" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "characters" ? "700" : "500"};">👤 Characters</button>
      <button class="vn-picker-filter-btn" data-filter="places" style="background: ${activeFilter === "places" ? "#38bdf8" : "#1e293b"}; color: ${activeFilter === "places" ? "#0f172a" : "#cbd5e1"}; border: 1px solid #334155; border-radius: 4px; padding: 2px 8px; font-size: 11px; cursor: pointer; font-weight: ${activeFilter === "places" ? "700" : "500"};">📍 Places</button>
    `;
    filterBar.querySelectorAll(".vn-picker-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeFilter = (btn as HTMLElement).dataset.filter || "all";
        renderFilterButtons();
        renderGrid();
      });
    });
  };
  renderFilterButtons();
  modalBox.appendChild(filterBar);

  // Content Grid
  const contentArea = document.createElement("div");
  contentArea.style.cssText = `
    padding: 14px 16px;
    overflow-y: auto;
    flex: 1;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  `;

  const renderGrid = () => {
    contentArea.innerHTML = "";
    const filtered = items.filter((it) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "characters") return it.category === "characters" || it.actorId || it.name.startsWith("👤");
      if (activeFilter === "places") return it.category === "places" || it.placeId || it.name.startsWith("📍");
      return true;
    });

    if (filtered.length === 0) {
      contentArea.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; color: #64748b; font-size: 12px; padding: 40px 10px;">
          No matching uploaded assets found in this category.
        </div>
      `;
      return;
    }

    for (const item of filtered) {
      const card = document.createElement("div");
      card.style.cssText = `
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        transition: transform 0.15s, border-color 0.15s;
      `;
      card.addEventListener("mouseenter", () => {
        card.style.borderColor = "#38bdf8";
        card.style.transform = "scale(1.03)";
      });
      card.addEventListener("mouseleave", () => {
        card.style.borderColor = "#334155";
        card.style.transform = "scale(1)";
      });

      card.innerHTML = `
        <div style="width: 100%; height: 96px; background: #020617; display: flex; align-items: center; justify-content: center; overflow: hidden; position: relative;">
          <img src="${item.url}" style="width: 100%; height: 100%; object-fit: cover;" alt="${item.name}" onerror="this.style.display='none'" />
        </div>
        <div style="padding: 6px; font-size: 11px; text-align: center; color: #f8fafc; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; background: #1e293b;">
          ${item.name}
        </div>
      `;

      card.addEventListener("click", () => {
        options.onSelect(item);
        close();
      });

      contentArea.appendChild(card);
    }
  };

  renderGrid();
  modalBox.appendChild(contentArea);
  modalOverlay.appendChild(modalBox);
  document.body.appendChild(modalOverlay);
}
