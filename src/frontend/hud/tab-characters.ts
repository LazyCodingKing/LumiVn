import type { LedgerData, ActorDossier, AssetManifest } from "../../shared/types.js";

// Helper normalizers for tuples vs objects emitted by LLM My World 1.79 ledger
function normalizeGoal(g: any): {
  id: string;
  intent: string;
  priority: number | string;
  commitment: number | string;
  deadline: string;
  cause: string;
  progress: number | string;
  status: string;
} {
  if (Array.isArray(g)) {
    return {
      id: String(g[0] ?? "goal"),
      intent: String(g[1] ?? ""),
      priority: g[2] ?? 0,
      commitment: g[3] ?? 0,
      deadline: String(g[4] ?? ""),
      cause: String(g[5] ?? ""),
      progress: g[6] ?? 0,
      status: String(g[7] ?? "active"),
    };
  }
  return {
    id: String(g?.id ?? "goal"),
    intent: String(g?.intent ?? g?.goal ?? g?.title ?? ""),
    priority: g?.priority ?? 0,
    commitment: g?.commitment ?? 0,
    deadline: String(g?.deadline ?? ""),
    cause: String(g?.cause ?? ""),
    progress: g?.progress ?? 0,
    status: String(g?.status ?? "active"),
  };
}

function normalizeSecret(s: any): {
  truth: string;
  knows: string[];
  suspects: string[];
  exposure: number;
  cover: string;
} {
  if (Array.isArray(s)) {
    return {
      truth: String(s[0] ?? ""),
      knows: Array.isArray(s[1]) ? s[1].map(String) : s[1] ? [String(s[1])] : [],
      suspects: Array.isArray(s[2]) ? s[2].map(String) : s[2] ? [String(s[2])] : [],
      exposure: Number(s[3] ?? 0),
      cover: String(s[4] ?? ""),
    };
  }
  return {
    truth: String(s?.truth ?? s?.secret ?? ""),
    knows: Array.isArray(s?.knows) ? s.knows.map(String) : [],
    suspects: Array.isArray(s?.suspects) ? s.suspects.map(String) : [],
    exposure: Number(s?.exposure ?? 0),
    cover: String(s?.cover ?? ""),
  };
}

function normalizeBelief(b: any): {
  proposition: string;
  confidence: number;
  source: string;
  basis: string;
  timestamp: string;
} {
  if (Array.isArray(b)) {
    return {
      proposition: String(b[0] ?? ""),
      confidence: Number(b[1] ?? 100),
      source: String(b[2] ?? "direct"),
      basis: String(b[3] ?? ""),
      timestamp: String(b[4] ?? ""),
    };
  }
  return {
    proposition: String(b?.proposition ?? b?.p ?? b?.belief ?? ""),
    confidence: Number(b?.confidence ?? b?.conf ?? 100),
    source: String(b?.source ?? "direct"),
    basis: String(b?.basis ?? ""),
    timestamp: String(b?.timestamp ?? b?.t ?? ""),
  };
}

function normalizeRoutine(r: any): {
  time: string;
  action: string;
  place: string;
  phase: string;
} {
  if (Array.isArray(r)) {
    return {
      time: String(r[0] ?? ""),
      action: String(r[1] ?? ""),
      place: String(r[2] ?? ""),
      phase: String(r[3] ?? ""),
    };
  }
  return {
    time: String(r?.time ?? r?.t ?? ""),
    action: String(r?.action ?? r?.activity ?? ""),
    place: String(r?.place ?? r?.loc ?? ""),
    phase: String(r?.phase ?? ""),
  };
}

export class CharactersTab {
  public root: HTMLElement;
  private selectedActorId: string | null = null;

  constructor() {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-characters";
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    this.root.innerHTML = "";
    const actors: Record<string, ActorDossier> = { ...(ledger.actors || {}) };

    // Supplement from roster if actors are not yet recorded as full dossiers
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id && !actors[r.id]) {
          actors[r.id] = {
            id: r.id,
            name: r.name || r.id,
            life_model: { occupation: r.status || "Resident" },
            agency: { want_now: r.status || "None" },
          };
        }
      }
    }

    const allKeys = Object.keys(actors);
    if (allKeys.length === 0) {
      this.root.innerHTML = `<div class="vn-muted" style="text-align:center; padding: 32px;">No characters recorded in the ledger yet.</div>`;
      return;
    }

    // Sort: user first, then alphabetical
    const actorIds = allKeys.sort((a, b) => {
      if (a.toLowerCase() === "user") return -1;
      if (b.toLowerCase() === "user") return 1;
      return a.localeCompare(b);
    });

    if (!this.selectedActorId || !actors[this.selectedActorId]) {
      this.selectedActorId = actorIds[0]!;
    }

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <div>
          <h3 style="margin:0; font-size:15px; color:#f8fafc; display:flex; align-items:center; gap:6px;">
            <span>👥</span> <span>Cast & Living World Dossiers</span>
          </h3>
          <p class="vn-muted" style="margin:2px 0 0 0; font-size:11px;">
            Inspect character personas, attire, hidden caches, tells, active goals, and guarded secrets.
          </p>
        </div>
        <span style="font-size:11px; background:#1e293b; border:1px solid #334155; padding:3px 8px; border-radius:6px; color:#94a3b8;">
          ${actorIds.length} actors tracked
        </span>
      </div>
    `;
    this.root.appendChild(header);

    // Avatar Ribbon
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 12px; overflow-x: auto; padding: 6px 4px 14px 4px; border-bottom: 1px solid #334155; margin-bottom: 16px;";

    for (const id of actorIds) {
      const actor = actors[id]!;
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");

      let avatarUrl = "";
      if (manifest?.characters?.[cleanId]) {
        const charData = manifest.characters[cleanId]!;
        const outfits = charData.outfits || (charData as any);
        const defaultSet = outfits?.["default"] || (outfits ? Object.values(outfits)[0] : undefined);
        avatarUrl = defaultSet?.["neutral"] || defaultSet?.["smile"] || (defaultSet ? Object.values(defaultSet)[0] : "") || "";
      }

      const item = document.createElement("div");
      item.style.cssText = `display: flex; flex-direction: column; align-items: center; cursor: pointer; min-width: 68px; transition: transform 0.15s ease;`;
      const displayName = id.toLowerCase() === "user" ? "Player (You)" : actor.name || id;

      item.innerHTML = `
        <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; border: 2px solid ${isSelected ? "#818cf8" : "#475569"}; box-shadow: ${isSelected ? "0 0 10px rgba(99,102,241,0.6)" : "none"}; background: #1e293b; display: flex; align-items: center; justify-content: center; position: relative;">
          ${avatarUrl ? `<img src="${avatarUrl}" style="width: 100%; height: 100%; object-fit: cover;" alt="${displayName}" />` : `<span style="font-size: 22px;">👤</span>`}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayName}
        </span>
      `;
      item.addEventListener("click", () => {
        this.selectedActorId = id;
        this.render(ledger, manifest);
      });
      ribbon.appendChild(item);
    }
    this.root.appendChild(ribbon);

    // Render Detailed Dossier of Selected Actor
    const currentActor = actors[this.selectedActorId]!;
    this.renderActorDetails(currentActor, ledger);
  }

  private renderActorDetails(actor: ActorDossier, ledger: LedgerData): void {
    const container = document.createElement("div");
    container.style.cssText = "display: flex; flex-direction: column; gap: 14px;";

    const isUser = (actor.id || "").toLowerCase() === "user";
    const displayName = isUser ? "Player (You)" : actor.name || actor.id || "Unknown";

    const app = (actor.appearance as Record<string, any>) || {};
    const money = (actor.money as Record<string, any>) || {};
    const combat = (actor.combat as Record<string, any>) || {};
    const life = (actor.life_model as Record<string, any>) || {};
    const outfit = (actor.outfit as Record<string, any>) || {};
    const inv = (actor.inventory as Record<string, any>) || {};
    const wounds = (actor.wounds as Record<string, any>) || {};
    const trauma = Array.isArray(actor.trauma) ? actor.trauma : [];
    const prof = (actor.profile as Record<string, any>) || {};
    const state = (actor.state as Record<string, any>) || {};
    const agency = (actor.agency as Record<string, any>) || {};
    const know = (actor.knowledge as Record<string, any>) || {};
    const rels = (actor.relations as Record<string, any>) || {};

    const conditionStr = app.condition || state.condition || "Normal";
    const wantStr = agency.want_now || "None declared";

    // 1. Identity & Physical Persona Banner
    const banner = document.createElement("div");
    banner.className = "vn-section";
    banner.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 12px; line-height: 1.5; color: #cbd5e1;";
    banner.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:6px; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <h4 style="margin:0; font-size:15px; color:#f8fafc;">${displayName}</h4>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(99,102,241,0.2); border:1px solid #6366f1; color:#c7d2fe;">
            ${life.occupation || "Resident"}
          </span>
          <span style="font-size:10px; padding:2px 6px; border-radius:4px; background:rgba(234,179,8,0.2); border:1px solid #eab308; color:#fef08a;">
            ${conditionStr}
          </span>
        </div>
        <div style="font-size:11px; color:#94a3b8;">
          Appeal: <strong style="color:#f43f5e;">${app.appeal ?? 50}/100</strong>
        </div>
      </div>

      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:6px; margin-bottom:8px;">
        <div><span style="color:#94a3b8;">Age:</span> <strong>${app.age || "Unknown"}</strong></div>
        <div><span style="color:#94a3b8;">Style:</span> <strong>${app.style || "Casual"}</strong></div>
        <div><span style="color:#94a3b8;">Residence:</span> <strong>${life.residence || "Current Scene"}</strong></div>
        <div><span style="color:#94a3b8;">Orientation:</span> <strong>${life.orientation || "Unspecified"}</strong></div>
      </div>

      ${app.traits ? `<div style="margin-bottom:6px; background:#0f172a; padding:6px 8px; border-radius:4px; border-left:3px solid #818cf8;"><strong>Traits:</strong> ${app.traits}</div>` : ""}

      <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:4px; padding:6px 8px; color:#e0f2fe; margin-top:4px;">
        <span style="color:#38bdf8; font-weight:700;">🎯 Immediate Want:</span> ${wantStr}
      </div>

      ${actor.constraints ? `
        <div style="margin-top:6px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:4px; padding:6px 8px; color:#fecdd3;">
          <span style="color:#f43f5e; font-weight:700;">⚠️ Constraint / Taboo:</span> ${actor.constraints}
        </div>
      ` : ""}
    `;
    container.appendChild(banner);

    // 2. Attire & Wardrobe Layer Breakdown
    const outfitSection = document.createElement("div");
    outfitSection.className = "vn-section";
    outfitSection.innerHTML = `<h4>👗 Attire & Wardrobe</h4>`;
    const outfitGrid = document.createElement("div");
    outfitGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 8px;";

    const outfitKeys: Array<{ label: string; key: string; icon: string }> = [
      { label: "Top", key: "top", icon: "👕" },
      { label: "Bottom", key: "bottom", icon: "👖" },
      { label: "Underwear Top", key: "underwear_top", icon: "👙" },
      { label: "Underwear Bottom", key: "underwear_bottom", icon: "🩲" },
      { label: "Footwear", key: "shoes", icon: "👟" },
      { label: "Hair & Makeup", key: "hair", icon: "💄" },
      { label: "Scent", key: "scent", icon: "✨" },
      { label: "Dishevelment", key: "state", icon: "🧵" },
    ];

    let hasOutfitItems = false;
    for (const item of outfitKeys) {
      let val = outfit[item.key] || (item.key === "shoes" ? outfit["footwear"] : undefined);
      if (val) {
        hasOutfitItems = true;
        const box = document.createElement("div");
        box.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px;";
        box.innerHTML = `
          <div style="color: #94a3b8; margin-bottom: 2px;">${item.icon} ${item.label}</div>
          <div style="color: #f8fafc; font-weight: 600;">${val}</div>
        `;
        outfitGrid.appendChild(box);
      }
    }

    if (outfit.accessories) {
      hasOutfitItems = true;
      const accList = Array.isArray(outfit.accessories) ? outfit.accessories.join(", ") : outfit.accessories;
      const accBox = document.createElement("div");
      accBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 10px; font-size: 11px; grid-column: 1 / -1;";
      accBox.innerHTML = `
        <div style="color: #94a3b8; margin-bottom: 2px;">💍 Accessories & Jewelry</div>
        <div style="color: #f8fafc; font-weight: 600;">${accList}</div>
      `;
      outfitGrid.appendChild(accBox);
    }

    if (!hasOutfitItems) {
      outfitGrid.innerHTML = `<div class="vn-muted" style="padding:8px;">Standard default attire</div>`;
    }
    outfitSection.appendChild(outfitGrid);
    container.appendChild(outfitSection);

    // 3. Possessions, Inventory & Wealth
    const invSection = document.createElement("div");
    invSection.className = "vn-section";
    invSection.innerHTML = `<h4>🎒 Equipment, Carried Gear & Finances</h4>`;

    const currencySymbol = money.currency || "$";
    const inHandCash = money.in_hand ?? 0;
    const inBankCash = money.in_bank ?? 0;
    const inHandL = inv.in_hand?.L || "Empty";
    const inHandR = inv.in_hand?.R || "Empty";
    const carriedList = Array.isArray(inv.carried) ? inv.carried : [];
    const roomList = Array.isArray(inv.room) ? inv.room : [];

    const invBox = document.createElement("div");
    invBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
    invBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; border-bottom:1px solid #334155; padding-bottom:8px;">
        <div style="display:flex; gap:16px;">
          <div><span style="color:#94a3b8;">In Hand:</span> <strong style="color:#22c55e;">${currencySymbol}${inHandCash}</strong></div>
          <div><span style="color:#94a3b8;">In Bank:</span> <strong style="color:#38bdf8;">${currencySymbol}${inBankCash}</strong></div>
        </div>
        <div style="font-size:11px; color:#cbd5e1;">
          Hands: <span style="color:#f8fafc;">[L: ${inHandL}] [R: ${inHandR}]</span>
        </div>
      </div>

      <div>
        <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Carried On Person:</div>
        <div style="display:flex; flex-wrap:wrap; gap:6px;">
          ${carriedList.length > 0 ? carriedList.map((item: any) => `<span style="background:#0f172a; border:1px solid #475569; padding:2px 8px; border-radius:4px; font-size:11px; color:#f8fafc;">📦 ${item}</span>`).join("") : `<span class="vn-muted">Nothing carried</span>`}
        </div>
      </div>

      ${roomList.length > 0 ? `
        <div style="margin-top:4px;">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Stored in Room (${inv.room_location || "Quarters"}):</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px;">
            ${roomList.map((item: any) => `<span style="background:#0f172a; border:1px solid #334155; padding:2px 8px; border-radius:4px; font-size:11px; color:#94a3b8;">🗄️ ${item}</span>`).join("")}
          </div>
        </div>
      ` : ""}
    `;
    invSection.appendChild(invBox);
    container.appendChild(invSection);

    // 4. Combat Vitals & RPG Stats (if populated)
    if (combat && (combat.hp || combat.pwr || combat.eff_pwr || combat.tier)) {
      const combatSection = document.createElement("div");
      combatSection.className = "vn-section";
      combatSection.innerHTML = `<h4>⚔️ Combat Vitals & Aptitudes</h4>`;

      const cBox = document.createElement("div");
      cBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px;";
      cBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px solid #334155; padding-bottom:6px;">
          <div>Tier: <strong style="color:#eab308;">${combat.tier ?? 1}</strong> | Lv: <strong style="color:#f8fafc;">${combat.lv ?? 1}</strong> (${combat.exp ?? "0/100"})</div>
          <div style="display:flex; gap:12px;">
            <div>HP: <strong style="color:#ef4444;">${combat.hp ?? "100/100"}</strong></div>
            <div>MP: <strong style="color:#3b82f6;">${combat.mp ?? "50/50"}</strong></div>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(90px, 1fr)); gap:6px; margin-bottom:8px;">
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">PWR: <strong>${combat.pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">AGI: <strong>${combat.agi ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">INT: <strong>${combat.int ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">Eff PWR: <strong>${combat.eff_pwr ?? "-"}</strong></div>
          <div style="background:#0f172a; padding:4px 8px; border-radius:4px;">Eff AGI: <strong>${combat.eff_agi ?? "-"}</strong></div>
        </div>

        ${combat.talent ? `
          <div style="font-size:11px;">
            <span style="color:#94a3b8;">Talents & Disciplines:</span>
            <div style="display:flex; flex-wrap:wrap; gap:4px; margin-top:4px;">
              ${(Array.isArray(combat.talent) ? combat.talent : [combat.talent]).map((t: any) => `<span style="background:rgba(129,140,248,0.15); border:1px solid #818cf8; color:#c7d2fe; padding:2px 6px; border-radius:4px;">✦ ${t}</span>`).join("")}
            </div>
          </div>
        ` : ""}
      `;
      combatSection.appendChild(cBox);
      container.appendChild(combatSection);
    }

    // 5. Psychological Condition, Wounds, Traumas & Tells
    const physWounds = Array.isArray(wounds.physical) ? wounds.physical : [];
    const psychWounds = Array.isArray(wounds.psychological) ? wounds.psychological : [];
    const tells = prof.tells ? (Array.isArray(prof.tells) ? prof.tells : [prof.tells]) : [];

    const psychoSection = document.createElement("div");
    psychoSection.className = "vn-section";
    psychoSection.innerHTML = `<h4>🧠 Condition, Tells & Wounds</h4>`;

    const psychoBox = document.createElement("div");
    psychoBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";
    psychoBox.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:8px;">
        <div>
          <div style="color:#fca5a5; font-weight:700; font-size:11px; margin-bottom:3px;">Physical Wounds:</div>
          <div>${physWounds.length > 0 ? physWounds.map((w: any) => `<span style="display:inline-block; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">🩹 ${w}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
        <div>
          <div style="color:#fcd34d; font-weight:700; font-size:11px; margin-bottom:3px;">Psychological Wounds & Trauma:</div>
          <div>${(psychWounds.length > 0 || trauma.length > 0) ? [...psychWounds, ...trauma].map((pw: any) => `<span style="display:inline-block; background:rgba(245,158,11,0.2); border:1px solid #f59e0b; color:#fde68a; padding:2px 6px; border-radius:4px; margin-right:4px; margin-bottom:4px;">⚠️ ${pw}</span>`).join("") : `<span class="vn-muted">None</span>`}</div>
        </div>
      </div>

      ${tells.length > 0 ? `
        <div style="margin-top:4px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:3px;">👁️ Behavioral Tells & Micro-Expressions:</div>
          <div style="color:#e0f2fe; font-size:11px;">${tells.join("; ")}</div>
        </div>
      ` : ""}

      ${(prof.defense || prof.blind_spot) ? `
        <div style="margin-top:2px; display:flex; flex-wrap:wrap; gap:12px; font-size:11px; color:#94a3b8;">
          ${prof.defense ? `<div>Defense: <strong style="color:#cbd5e1;">${prof.defense}</strong></div>` : ""}
          ${prof.blind_spot ? `<div>Blind Spot: <strong style="color:#cbd5e1;">${prof.blind_spot}</strong></div>` : ""}
        </div>
      ` : ""}
    `;
    psychoSection.appendChild(psychoBox);
    container.appendChild(psychoSection);

    // 6. Life Model, Upbringing & Daily Routines
    const routines = Array.isArray(life.routines) ? life.routines.map(normalizeRoutine) : [];
    const lifeSection = document.createElement("div");
    lifeSection.className = "vn-section";
    lifeSection.innerHTML = `<h4>📖 Persona, Upbringing & Routines</h4>`;

    const lifeBox = document.createElement("div");
    lifeBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";
    lifeBox.innerHTML = `
      ${life.romantic_history ? `<div><span style="color:#94a3b8;">Romantic History:</span> <strong style="color:#f8fafc;">${life.romantic_history}</strong></div>` : ""}
      ${life.upbringing ? `<div><span style="color:#94a3b8;">Upbringing:</span> <span style="color:#cbd5e1;">${life.upbringing}</span></div>` : ""}
      ${life.worldview ? `<div><span style="color:#94a3b8;">Worldview:</span> <span style="color:#cbd5e1;">"${life.worldview}"</span></div>` : ""}
      ${life.family ? `<div><span style="color:#94a3b8;">Family:</span> <span style="color:#cbd5e1;">${Array.isArray(life.family) ? life.family.join(", ") : life.family}</span></div>` : ""}

      ${routines.length > 0 ? `
        <div style="margin-top:6px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#94a3b8; font-size:11px; margin-bottom:4px;">Daily Routines & Schedules:</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${routines.map(r => `
              <div style="display:flex; justify-content:space-between; background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px;">
                <span style="color:#38bdf8; font-weight:700;">${r.time} (${r.phase})</span>
                <span style="color:#f8fafc;">${r.action}</span>
                <span style="color:#94a3b8;">@ ${r.place}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
    lifeSection.appendChild(lifeBox);
    container.appendChild(lifeSection);

    // 7. Agency: Active Goals & Directives
    const rawGoals = Array.isArray(agency.goals) ? agency.goals : [];
    if (rawGoals.length > 0) {
      const goals = rawGoals.map(normalizeGoal);
      const goalSection = document.createElement("div");
      goalSection.className = "vn-section";
      goalSection.innerHTML = `<h4>🎯 Active Goals & Directives (${goals.length})</h4>`;

      const goalList = document.createElement("div");
      goalList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const g of goals) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px;";
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#38bdf8; font-size:12px;">${g.intent}</strong>
            <span style="padding:1px 6px; border-radius:4px; background:rgba(34,197,94,0.2); border:1px solid #22c55e; color:#86efac;">
              ${g.status} (${g.progress}%)
            </span>
          </div>
          <div style="display:flex; gap:12px; color:#94a3b8; flex-wrap:wrap;">
            <span>Priority: <strong style="color:#f8fafc;">${g.priority}</strong></span>
            <span>Commitment: <strong style="color:#f8fafc;">${g.commitment}</strong></span>
            ${g.deadline ? `<span>Deadline: <strong style="color:#fca5a5;">${g.deadline}</strong></span>` : ""}
          </div>
          ${g.cause ? `<div style="margin-top:4px; color:#cbd5e1; font-style:italic;">Cause: ${g.cause}</div>` : ""}
        `;
        goalList.appendChild(item);
      }
      goalSection.appendChild(goalList);
      container.appendChild(goalSection);
    }

    // 8. Knowledge, Guarded Secrets & Core Beliefs
    const rawSecrets = Array.isArray(know.secrets) ? know.secrets : [];
    const rawBeliefs = Array.isArray(know.beliefs) ? know.beliefs : [];
    if (rawSecrets.length > 0 || rawBeliefs.length > 0) {
      const knowSection = document.createElement("div");
      knowSection.className = "vn-section";
      knowSection.innerHTML = `<h4>🔒 Guarded Secrets & Epistemic Beliefs</h4>`;

      const knowBox = document.createElement("div");
      knowBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";

      if (rawSecrets.length > 0) {
        const secrets = rawSecrets.map(normalizeSecret);
        knowBox.innerHTML += `
          <div>
            <div style="color:#f43f5e; font-weight:700; font-size:11px; margin-bottom:4px;">Guarded Secrets:</div>
            <div style="display:flex; flex-direction:column; gap:6px;">
              ${secrets.map(s => `
                <div style="background:#0f172a; border-left:3px solid #f43f5e; padding:6px 8px; border-radius:4px; font-size:11px;">
                  <div style="color:#fecdd3; font-weight:600;">"${s.truth}"</div>
                  <div style="display:flex; gap:12px; margin-top:3px; color:#94a3b8; font-size:10px;">
                    <span>Exposure Risk: <strong style="color:#fb7185;">${s.exposure}%</strong></span>
                    <span>Knows: <strong style="color:#f8fafc;">${s.knows.join(", ") || "Self only"}</strong></span>
                    ${s.cover ? `<span>Cover: <em>${s.cover}</em></span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      if (rawBeliefs.length > 0) {
        const beliefs = rawBeliefs.map(normalizeBelief);
        knowBox.innerHTML += `
          <div style="margin-top:4px;">
            <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:4px;">Epistemic Beliefs:</div>
            <div style="display:flex; flex-direction:column; gap:4px;">
              ${beliefs.map(b => `
                <div style="background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; display:flex; justify-content:space-between;">
                  <span style="color:#e0f2fe;">"${b.proposition}"</span>
                  <span style="color:#94a3b8; font-size:10px;">conf: ${b.confidence}% (${b.source})</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      knowSection.appendChild(knowBox);
      container.appendChild(knowSection);
    }

    // 9. Relational Ties Matrix
    const targetIds = Object.keys(rels);
    if (targetIds.length > 0) {
      const relsSection = document.createElement("div");
      relsSection.className = "vn-section";
      relsSection.innerHTML = `<h4>🤝 Interpersonal Relations (${targetIds.length})</h4>`;

      const relsList = document.createElement("div");
      relsList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const targetId of targetIds) {
        const r = rels[targetId] as Record<string, any>;
        const targetName = targetId.toLowerCase() === "user" ? "Player (You)" : ledger.actors?.[targetId]?.name || targetId;
        const bThreshold = r.betrayal_threshold ?? "N/A";

        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 8px 10px; font-size: 11px;";
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:#818cf8; font-size:12px;">Towards ${targetName}</strong>
            <span style="font-size:10px; background:rgba(239,68,68,0.2); border:1px solid #ef4444; color:#fca5a5; padding:1px 6px; border-radius:4px;">
              Betrayal Thresh: ${bThreshold}
            </span>
          </div>
          <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(80px, 1fr)); gap:4px; color:#cbd5e1;">
            <div>Affinity: <strong>${r.affinity ?? 0}</strong></div>
            <div>Trust: <strong>${r.trust ?? 0}</strong></div>
            <div>Respect: <strong>${r.respect ?? 0}</strong></div>
            <div>Attraction: <strong>${r.attraction ?? 0}</strong></div>
            <div>Loyalty: <strong>${r.loyalty ?? 0}</strong></div>
          </div>
          ${(r.leverage && r.leverage.length > 0) ? `<div style="margin-top:4px; color:#f59e0b;">Leverage: ${r.leverage.join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
      container.appendChild(relsSection);
    }

    this.root.appendChild(container);
  }
}
