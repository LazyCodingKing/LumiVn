import type { LedgerData, ActorDossier, AssetManifest, RosterCharacter } from "../../shared/types.js";
import type { VnTtsEngine } from "../stage/tts-engine.js";

// Helper normalizers for tuples vs objects emitted by LLM My World 1.85 ledger
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

function normalizePlan(p: any): {
  goal: string;
  steps: any[];
  now: string;
  preconditions: any[];
  revisions: number;
} {
  if (Array.isArray(p)) {
    return {
      goal: String(p[0] ?? ""),
      steps: Array.isArray(p[1]) ? p[1] : p[1] ? [p[1]] : [],
      now: String(p[2] ?? ""),
      preconditions: Array.isArray(p[3]) ? p[3] : p[3] ? [p[3]] : [],
      revisions: Number(p[4] ?? 0),
    };
  }
  return {
    goal: String(p?.goal ?? ""),
    steps: Array.isArray(p?.steps) ? p.steps : p?.steps ? [p.steps] : [],
    now: String(p?.now ?? ""),
    preconditions: Array.isArray(p?.preconditions) ? p.preconditions : p?.preconditions ? [p.preconditions] : [],
    revisions: Number(p?.revisions ?? 0),
  };
}

function normalizeMemory(m: any): {
  evt: string;
  interpretation: string;
  salience: number;
  imprint: string;
  with: string;
} {
  if (Array.isArray(m)) {
    return {
      evt: String(m[0] ?? ""),
      interpretation: String(m[1] ?? ""),
      salience: Number(m[2] ?? 0),
      imprint: String(m[3] ?? ""),
      with: String(m[4] ?? ""),
    };
  }
  return {
    evt: String(m?.evt ?? m?.event ?? ""),
    interpretation: String(m?.interpretation ?? ""),
    salience: Number(m?.salience ?? 0),
    imprint: String(m?.imprint ?? ""),
    with: String(m?.with ?? ""),
  };
}

function normalizeExpectation(e: any): {
  situation: string;
  expect: string;
  conf: number;
} {
  if (Array.isArray(e)) {
    return {
      situation: String(e[0] ?? ""),
      expect: String(e[1] ?? ""),
      conf: Number(e[2] ?? 100),
    };
  }
  return {
    situation: String(e?.situation ?? ""),
    expect: String(e?.expect ?? ""),
    conf: Number(e?.conf ?? 100),
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
  private ttsEngine?: VnTtsEngine;

  constructor(ttsEngine?: VnTtsEngine) {
    this.ttsEngine = ttsEngine;
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

    // Supplement from scene participants
    if (ledger.scene?.participants && Array.isArray(ledger.scene.participants)) {
      for (const p of ledger.scene.participants) {
        if (typeof p === "string" && !actors[p]) {
          actors[p] = {
            id: p,
            name: p,
            life_model: { occupation: "Participant" },
            agency: { want_now: "Present in scene" },
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

    // Avatar Ribbon with LOD and Location fallback
    const ribbon = document.createElement("div");
    ribbon.style.cssText = "display: flex; gap: 12px; overflow-x: auto; padding: 6px 4px 14px 4px; border-bottom: 1px solid #334155; margin-bottom: 16px;";

    const rosterMap = new Map<string, RosterCharacter>();
    if (ledger.roster && Array.isArray(ledger.roster)) {
      for (const r of ledger.roster) {
        if (r.id) rosterMap.set(r.id.toLowerCase(), r);
      }
    }

    for (const id of actorIds) {
      const actor = actors[id]!;
      const isSelected = id === this.selectedActorId;
      const cleanId = id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      const rosterItem = rosterMap.get(id.toLowerCase());

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
          ${rosterItem ? `<span style="position: absolute; bottom: 0; right: 0; font-size: 9px; background: #0f172a; padding: 1px 3px; border-radius: 3px; border: 1px solid #334155; color: #a5b4fc; font-weight: 700;">L${rosterItem.lod ?? 1}</span>` : ""}
        </div>
        <span style="font-size: 11px; margin-top: 5px; color: ${isSelected ? "#f8fafc" : "#94a3b8"}; font-weight: ${isSelected ? "700" : "500"}; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
          ${displayName}
        </span>
        ${rosterItem?.loc ? `<span style="font-size: 9px; color: #64748b; max-width: 68px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${rosterItem.loc}</span>` : ""}
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
    const selfConcept = prof.self_concept || life.self_concept || "";

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

      ${selfConcept ? `
        <div style="margin-top:6px; background:#0f172a; border-left:3px solid #38bdf8; padding:6px 8px; border-radius:4px; color:#cbd5e1; font-size:11px;">
          <span style="color:#38bdf8; font-weight:700;">🪞 Self-Concept:</span> "${selfConcept}"
        </div>
      ` : ""}

      ${(actor.constraints || prof.constraints) ? `
        <div style="margin-top:6px; background:rgba(244,63,94,0.1); border:1px solid rgba(244,63,94,0.3); border-radius:4px; padding:6px 8px; color:#fecdd3;">
          <span style="color:#f43f5e; font-weight:700;">⚠️ Constraint / Taboo:</span> ${actor.constraints || prof.constraints}
        </div>
      ` : ""}

      ${(prof.boundaries || prof.red_lines) ? `
        <div style="margin-top:6px; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.boundaries ? `<div><span style="color:#f59e0b; font-weight:600;">🚧 Boundaries:</span> <span style="color:#fde68a;">${Array.isArray(prof.boundaries) ? prof.boundaries.join("; ") : prof.boundaries}</span></div>` : ""}
          ${prof.red_lines ? `<div><span style="color:#ef4444; font-weight:600;">🚫 Red Lines:</span> <span style="color:#fca5a5;">${Array.isArray(prof.red_lines) ? prof.red_lines.join("; ") : prof.red_lines}</span></div>` : ""}
        </div>
      ` : ""}

      ${(prof.values || prof.public_roles || prof.capabilities) ? `
        <div style="margin-top:6px; padding-top:6px; border-top:1px solid #334155; display:flex; flex-direction:column; gap:4px; font-size:11px;">
          ${prof.values ? `<div><span style="color:#94a3b8;">Values:</span> <strong style="color:#f8fafc;">${Array.isArray(prof.values) ? prof.values.join(", ") : prof.values}</strong></div>` : ""}
          ${prof.public_roles ? `<div><span style="color:#94a3b8;">Public Roles:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.public_roles) ? prof.public_roles.join(", ") : prof.public_roles}</span></div>` : ""}
          ${prof.capabilities ? `<div><span style="color:#94a3b8;">Capabilities:</span> <span style="color:#cbd5e1;">${Array.isArray(prof.capabilities) ? prof.capabilities.join(", ") : prof.capabilities}</span></div>` : ""}
        </div>
      ` : ""}
    `;

    // Passions Snapshot Badges
    const rawPassions = actor.passions;
    if (rawPassions) {
      let passionBadges: string[] = [];
      if (Array.isArray(rawPassions)) {
        passionBadges = rawPassions.map((p: any) => {
          if (typeof p === "string") return p;
          if (typeof p === "object" && p !== null) {
            const label = p.name || p.id || "passion";
            const val = p.intensity ?? p.value ?? "";
            const target = p.target ? ` ➔ ${p.target}` : "";
            return `${label}${target}: ${val}`;
          }
          return String(p);
        });
      } else if (typeof rawPassions === "object") {
        passionBadges = Object.entries(rawPassions).map(([k, v]) => `${k}: ${v}`);
      }

      if (passionBadges.length > 0) {
        const pContainer = document.createElement("div");
        pContainer.style.cssText = "margin-top: 8px; padding-top: 6px; border-top: 1px solid #334155;";
        pContainer.innerHTML = `
          <div style="font-size: 11px; color: #f43f5e; font-weight: 700; margin-bottom: 4px;">❤️ Passions & Emotional Drives:</div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;">
            ${passionBadges.map((badge) => `<span style="background: rgba(244,63,94,0.15); border: 1px solid rgba(244,63,94,0.4); color: #fda4af; font-size: 11px; padding: 2px 8px; border-radius: 4px;">🔥 ${badge}</span>`).join("")}
          </div>
        `;
        banner.appendChild(pContainer);
      }
    }

    container.appendChild(banner);

    // 2. Dispositions Grid
    const disps = prof.dispositions as Record<string, any> | undefined;
    if (disps && typeof disps === "object" && Object.keys(disps).length > 0) {
      const dispSection = document.createElement("div");
      dispSection.className = "vn-section";
      dispSection.innerHTML = `<h4>🧭 Personality Dispositions</h4>`;

      const dispGrid = document.createElement("div");
      dispGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 6px;";

      const dispLabels: Record<string, string> = {
        risk: "Risk Propensity",
        assertiveness: "Assertiveness",
        empathy: "Empathy",
        impulse_control: "Impulse Control",
        curiosity: "Curiosity",
        sociability: "Sociability",
        status_sensitivity: "Status Sensitivity",
        acquisitiveness: "Acquisitiveness",
        persistence: "Persistence",
      };

      for (const [k, v] of Object.entries(disps)) {
        const label = dispLabels[k] || k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        const box = document.createElement("div");
        box.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 6px 8px; font-size: 11px;";
        box.innerHTML = `
          <div style="color: #94a3b8; font-size: 10px; margin-bottom: 2px;">${label}</div>
          <div style="color: #f8fafc; font-weight: 700;">${v}</div>
        `;
        dispGrid.appendChild(box);
      }
      dispSection.appendChild(dispGrid);
      container.appendChild(dispSection);
    }

    // 3. Needs & Affect Episodes
    const hasNeeds = state.needs && (Array.isArray(state.needs) ? state.needs.length > 0 : Object.keys(state.needs).length > 0);
    const affectEpisodes = state.affect?.episodes || state.affect_episodes;
    const hasAffect = Array.isArray(affectEpisodes) && affectEpisodes.length > 0;

    if (hasNeeds || hasAffect) {
      const needsSection = document.createElement("div");
      needsSection.className = "vn-section";
      needsSection.innerHTML = `<h4>⚡ Active Needs & Affect Episodes</h4>`;

      const nBox = document.createElement("div");
      nBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display: flex; flex-direction: column; gap: 8px;";

      if (hasNeeds) {
        let needsItems: Array<{ name: string; urgency: string | number }> = [];
        if (Array.isArray(state.needs)) {
          needsItems = state.needs.map((n: any) => {
            if (Array.isArray(n)) return { name: String(n[0] ?? ""), urgency: n[1] ?? 0 };
            if (typeof n === "object" && n !== null) return { name: String(n.name ?? n.need ?? ""), urgency: n.urgency ?? n.value ?? 0 };
            return { name: String(n), urgency: "" };
          });
        } else if (typeof state.needs === "object" && state.needs !== null) {
          needsItems = Object.entries(state.needs).map(([k, v]) => ({ name: k, urgency: String(v) }));
        }

        nBox.innerHTML += `
          <div>
            <div style="color: #38bdf8; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Pressing Needs:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${needsItems.map((n) => `
                <span style="background: #0f172a; border: 1px solid #0284c7; padding: 3px 8px; border-radius: 4px; font-size: 11px;">
                  <strong style="color: #7dd3fc;">${n.name}</strong>${n.urgency !== "" ? `<span style="color: #94a3b8;"> (urgency: ${n.urgency})</span>` : ""}
                </span>
              `).join("")}
            </div>
          </div>
        `;
      }

      if (hasAffect) {
        const epFormatted = affectEpisodes.map((ep: any) => {
          if (typeof ep === "string") return ep;
          if (Array.isArray(ep)) return `${ep[0] ?? ""}${ep[1] ? ` ➔ ${ep[1]}` : ""}${ep[2] !== undefined ? ` (${ep[2]})` : ""}`;
          if (typeof ep === "object" && ep !== null) {
            return `${ep.name || ep.emotion || "affect"}${ep.target ? ` ➔ ${ep.target}` : ""}${ep.intensity !== undefined ? ` (${ep.intensity})` : ""}`;
          }
          return String(ep);
        });

        nBox.innerHTML += `
          <div style="${hasNeeds ? "border-top: 1px solid #334155; padding-top: 6px;" : ""}">
            <div style="color: #eab308; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Affect Episodes:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${epFormatted.map((ep: string) => `
                <span style="background: rgba(234,179,8,0.15); border: 1px solid #eab308; color: #fef08a; padding: 2px 8px; border-radius: 4px; font-size: 11px;">
                  ⚡ ${ep}
                </span>
              `).join("")}
            </div>
          </div>
        `;
      }

      needsSection.appendChild(nBox);
      container.appendChild(needsSection);
    }

    // 4. Attire & Wardrobe Layer Breakdown
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
      { label: "Condition", key: "state", icon: "🧵" },
      { label: "Integrity", key: "integrity", icon: "🛡️" },
      { label: "Residue", key: "residue", icon: "💧" },
    ];

    let hasOutfitItems = false;
    for (const item of outfitKeys) {
      let val = (outfit as any)[item.key] || (item.key === "shoes" ? (outfit as any)["footwear"] : undefined);
      if (item.key === "integrity" && val !== undefined) {
        val = `${val}%`;
      } else if (item.key === "residue" && Array.isArray(val)) {
        val = val.length > 0 ? val.join(", ") : undefined;
      }
      if (val !== undefined && val !== null && val !== "") {
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

    // 5. Possessions, Inventory & Wealth
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

    // 6. Combat Vitals & RPG Stats (if populated)
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

    // 7. Psychological Condition, Wounds, Traumas & Tells
    const physWounds = Array.isArray(wounds.physical) ? wounds.physical : [];
    const psychWounds = Array.isArray(wounds.psychological) ? wounds.psychological : [];

    // Behavioral tells: object or array
    let formattedTells: string[] = [];
    if (prof.tells) {
      if (Array.isArray(prof.tells)) {
        formattedTells = prof.tells.map(String);
      } else if (typeof prof.tells === "object") {
        formattedTells = Object.entries(prof.tells).map(([cue, desc]) => `${cue.toUpperCase()}: ${desc}`);
      } else {
        formattedTells = [String(prof.tells)];
      }
    }

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

      ${formattedTells.length > 0 ? `
        <div style="margin-top:4px; border-top:1px solid #334155; padding-top:6px;">
          <div style="color:#38bdf8; font-weight:700; font-size:11px; margin-bottom:3px;">👁️ Behavioral Tells & Micro-Expressions:</div>
          <div style="display:flex; flex-direction:column; gap:3px;">
            ${formattedTells.map((t) => `<div style="background:#0f172a; padding:4px 8px; border-radius:4px; font-size:11px; color:#e0f2fe;">${t}</div>`).join("")}
          </div>
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

    // 8. Life Model, Upbringing & Daily Routines
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

    // 9. Agency: Active Goals, Plans, Policies & Commitments
    const rawGoals = Array.isArray(agency.goals) ? agency.goals : [];
    const rawPlans = Array.isArray(agency.plans) ? agency.plans : [];
    const rawPolicies = Array.isArray(agency.policies) ? agency.policies : [];
    const rawCommitments = Array.isArray(agency.commitments) ? agency.commitments : [];

    if (rawGoals.length > 0 || rawPlans.length > 0 || rawPolicies.length > 0 || rawCommitments.length > 0) {
      const agencySection = document.createElement("div");
      agencySection.className = "vn-section";
      agencySection.innerHTML = `<h4>🎯 Agency, Plans & Directives</h4>`;

      const agencyBody = document.createElement("div");
      agencyBody.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      // Goals
      if (rawGoals.length > 0) {
        const goals = rawGoals.map(normalizeGoal);
        const goalList = document.createElement("div");
        goalList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
        goalList.innerHTML = `<div style="color: #38bdf8; font-weight: 700; font-size: 11px;">Active Goals (${goals.length}):</div>`;

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
        agencyBody.appendChild(goalList);
      }

      // Plans
      if (rawPlans.length > 0) {
        const plans = rawPlans.map(normalizePlan);
        const planList = document.createElement("div");
        planList.style.cssText = "display: flex; flex-direction: column; gap: 6px;";
        planList.innerHTML = `<div style="color: #818cf8; font-weight: 700; font-size: 11px;">Action Plans (${plans.length}):</div>`;

        for (const p of plans) {
          const item = document.createElement("div");
          item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px;";
          item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
              <strong style="color:#c7d2fe; font-size:12px;">Goal: ${p.goal}</strong>
              <span style="font-size:10px; color:#94a3b8;">Rev: ${p.revisions}</span>
            </div>
            ${p.now ? `<div style="background:#0f172a; padding:4px 8px; border-radius:4px; margin-bottom:4px; color:#38bdf8;"><strong>Current Step:</strong> ${p.now}</div>` : ""}
            ${p.steps.length > 0 ? `
              <div style="color:#94a3b8; margin-top:2px;">
                Steps: <span style="color:#cbd5e1;">${p.steps.join(" ➔ ")}</span>
              </div>
            ` : ""}
            ${p.preconditions.length > 0 ? `
              <div style="color:#94a3b8; margin-top:2px;">
                Preconditions: <span style="color:#fde68a;">${p.preconditions.join("; ")}</span>
              </div>
            ` : ""}
          `;
          planList.appendChild(item);
        }
        agencyBody.appendChild(planList);
      }

      // Policies & Commitments
      if (rawPolicies.length > 0 || rawCommitments.length > 0) {
        const polBox = document.createElement("div");
        polBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 10px; font-size: 11px; display: flex; flex-direction: column; gap: 6px;";
        if (rawPolicies.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #f59e0b; font-weight: 700;">Operating Policies:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawPolicies.map((pol: any) => `<li>${typeof pol === "object" ? JSON.stringify(pol) : String(pol)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        if (rawCommitments.length > 0) {
          polBox.innerHTML += `
            <div>
              <span style="color: #22c55e; font-weight: 700;">Active Commitments:</span>
              <ul style="margin: 2px 0 0 16px; padding: 0; color: #cbd5e1;">
                ${rawCommitments.map((com: any) => `<li>${typeof com === "object" ? JSON.stringify(com) : String(com)}</li>`).join("")}
              </ul>
            </div>
          `;
        }
        agencyBody.appendChild(polBox);
      }

      agencySection.appendChild(agencyBody);
      container.appendChild(agencySection);
    }

    // 10. Knowledge, Epistemics, Memories, Expectations & Secrets
    const rawSecrets = Array.isArray(know.secrets) ? know.secrets : [];
    const rawBeliefs = Array.isArray(know.beliefs) ? know.beliefs : [];
    const rawMemories = Array.isArray(know.memories) ? know.memories : [];
    const rawExpectations = Array.isArray(know.expectations) ? know.expectations : [];
    const heldLeverage = know.held_leverage;
    const presentsAs = know.presents_as;

    if (rawSecrets.length > 0 || rawBeliefs.length > 0 || rawMemories.length > 0 || rawExpectations.length > 0 || heldLeverage || presentsAs) {
      const knowSection = document.createElement("div");
      knowSection.className = "vn-section";
      knowSection.innerHTML = `<h4>🔒 Epistemics, Memories & Guarded Secrets</h4>`;

      const knowBox = document.createElement("div");
      knowBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; font-size: 12px; display:flex; flex-direction:column; gap:8px;";

      // Presents As
      if (presentsAs) {
        knowBox.innerHTML += `
          <div style="background: #0f172a; padding: 6px 8px; border-radius: 4px; font-size: 11px; border-left: 3px solid #818cf8;">
            <strong style="color: #818cf8;">Presents As:</strong> <span style="color: #e0f2fe;">${typeof presentsAs === "object" ? JSON.stringify(presentsAs) : String(presentsAs)}</span>
          </div>
        `;
      }

      // Held Leverage
      if (heldLeverage && (Array.isArray(heldLeverage) ? heldLeverage.length > 0 : true)) {
        const levList = Array.isArray(heldLeverage) ? heldLeverage : [heldLeverage];
        knowBox.innerHTML += `
          <div style="background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.3); padding: 6px 8px; border-radius: 4px; font-size: 11px;">
            <strong style="color: #f59e0b;">Held Leverage:</strong>
            <span style="color: #fde68a;">${levList.map((x: any) => typeof x === "object" ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join("; ")}</span>
          </div>
        `;
      }

      // Memories
      if (rawMemories.length > 0) {
        const memories = rawMemories.map(normalizeMemory);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color: #c084fc; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Salient Memories (${memories.length}):</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${memories.map((m) => `
                <div style="background: #0f172a; padding: 6px 8px; border-radius: 4px; font-size: 11px;">
                  <div style="color: #f8fafc; font-weight: 600;">"${m.evt}"</div>
                  <div style="display: flex; gap: 10px; margin-top: 2px; color: #94a3b8; font-size: 10px; flex-wrap: wrap;">
                    <span>Interpretation: <strong style="color: #cbd5e1;">${m.interpretation || "—"}</strong></span>
                    <span>Salience: <strong style="color: #d8b4fe;">${m.salience}</strong></span>
                    ${m.with ? `<span>With: ${m.with}</span>` : ""}
                    ${m.imprint ? `<span>Imprint: <em>${m.imprint}</em></span>` : ""}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // Expectations
      if (rawExpectations.length > 0) {
        const expects = rawExpectations.map(normalizeExpectation);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
            <div style="color: #38bdf8; font-weight: 700; font-size: 11px; margin-bottom: 4px;">Social & Situational Expectations (${expects.length}):</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              ${expects.map((e) => `
                <div style="background: #0f172a; padding: 4px 8px; border-radius: 4px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
                  <span><strong style="color: #7dd3fc;">[${e.situation}]</strong> <span style="color: #e0f2fe;">${e.expect}</span></span>
                  <span style="color: #94a3b8; font-size: 10px;">conf: ${e.conf}%</span>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      // Guarded Secrets
      if (rawSecrets.length > 0) {
        const secrets = rawSecrets.map(normalizeSecret);
        knowBox.innerHTML += `
          <div style="margin-top: 4px;">
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

      // Beliefs
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

    // 11. Relational Ties Matrix
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
          ${(r.grievances && (Array.isArray(r.grievances) ? r.grievances.length > 0 : true)) ? `
            <div style="margin-top:4px; color:#f87171;">
              Grievances: <span style="color:#fecdd3;">${(Array.isArray(r.grievances) ? r.grievances : [r.grievances]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${(r.shared_secrets && (Array.isArray(r.shared_secrets) ? r.shared_secrets.length > 0 : true)) ? `
            <div style="margin-top:4px; color:#c084fc;">
              Shared Secrets: <span style="color:#e9d5ff;">${(Array.isArray(r.shared_secrets) ? r.shared_secrets : [r.shared_secrets]).map(String).join("; ")}</span>
            </div>
          ` : ""}
          ${(r.leverage && (Array.isArray(r.leverage) ? r.leverage.length > 0 : true)) ? `<div style="margin-top:4px; color:#f59e0b;">Leverage: ${(Array.isArray(r.leverage) ? r.leverage : [r.leverage]).map((x: any) => typeof x === 'object' ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join(", ")}</div>` : ""}
          ${(r.obligations && (Array.isArray(r.obligations) ? r.obligations.length > 0 : true)) ? `<div style="margin-top:4px; color:#38bdf8;">Obligations: ${(Array.isArray(r.obligations) ? r.obligations : [r.obligations]).map((x: any) => typeof x === 'object' ? (x.truth || x.id || JSON.stringify(x)) : String(x)).join(", ")}</div>` : ""}
        `;
        relsList.appendChild(card);
      }
      relsSection.appendChild(relsList);
      container.appendChild(relsSection);
    }

    // Add Voice Assignment Panel to Character Dossier
    if (this.ttsEngine) {
      const voiceSec = document.createElement("div");
      voiceSec.className = "vn-section";
      voiceSec.innerHTML = `<h4>🎙️ Voice Assignment (TTS)</h4>`;

      const vBox = document.createElement("div");
      vBox.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; font-size: 12px; display: flex; flex-direction: column; gap: 10px;";
      
      const currentVoice = this.ttsEngine.resolveVoice(isUser ? "user" : actor.name || actor.id);
      const isNarrator = (actor.id || "").toLowerCase() === "narrator";

      vBox.innerHTML = `
        <div style="font-size: 11px; color: #94a3b8;">
          Assign a distinct voice connection for <strong>${displayName}</strong>.
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div>
            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">TTS Profile / Connection:</label>
            <select id="vn-voice-profile-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 6px; font-size: 11px;">
              <option value="">(Default / Inherited)</option>
            </select>
          </div>
          <div>
            <label style="font-size: 10px; color: #94a3b8; display: block; margin-bottom: 2px;">Voice:</label>
            <select id="vn-voice-id-select" style="width: 100%; background: #0f172a; color: #fff; border: 1px solid #475569; border-radius: 4px; padding: 6px; font-size: 11px;">
              <option value="">(Profile Default Voice)</option>
            </select>
          </div>
        </div>
        <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end; margin-top: 4px;">
          <button id="vn-voice-test-btn" style="background: #334155; border: 1px solid #475569; border-radius: 4px; color: #cbd5e1; font-size: 11px; padding: 4px 10px; cursor: pointer;">
            ▶ Test Voice
          </button>
          <button id="vn-voice-save-btn" style="background: #6366f1; border: none; border-radius: 4px; color: #fff; font-size: 11px; font-weight: 700; padding: 4px 12px; cursor: pointer;">
            Save Voice
          </button>
        </div>
      `;

      voiceSec.appendChild(vBox);
      container.appendChild(voiceSec);

      // Populate Profiles from Host
      const profileSelect = vBox.querySelector("#vn-voice-profile-select") as HTMLSelectElement;
      const voiceSelect = vBox.querySelector("#vn-voice-id-select") as HTMLSelectElement;
      const saveBtn = vBox.querySelector("#vn-voice-save-btn") as HTMLButtonElement;
      const testBtn = vBox.querySelector("#vn-voice-test-btn") as HTMLButtonElement;

      void this.ttsEngine.listProfiles().then((profiles) => {
        profiles.forEach((p) => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = `${p.name} (${p.provider})`;
          if (currentVoice?.connectionId === p.id) opt.selected = true;
          profileSelect.appendChild(opt);
        });

        if (profileSelect.value) {
          void updateVoiceList(profileSelect.value);
        }
      });

      const updateVoiceList = async (connId: string) => {
        voiceSelect.innerHTML = `<option value="">(Profile Default Voice)</option>`;
        if (!connId) return;
        const voices = await this.ttsEngine!.listVoices(connId);
        voices.forEach((v) => {
          const opt = document.createElement("option");
          opt.value = v.id;
          opt.textContent = v.name;
          if (currentVoice?.voice === v.id) opt.selected = true;
          voiceSelect.appendChild(opt);
        });
      };

      profileSelect.addEventListener("change", () => {
        void updateVoiceList(profileSelect.value);
      });

      saveBtn.addEventListener("click", () => {
        const connectionId = profileSelect.value;
        const voice = voiceSelect.value;
        const settings = this.ttsEngine!.getSettings();

        if (isNarrator) {
          this.ttsEngine!.updateSettings({
            narrator: connectionId ? { connectionId, voice } : null,
          });
        } else {
          const key = (actor.name || actor.id || "").toLowerCase();
          const nextChars = { ...settings.characters };
          if (connectionId) {
            nextChars[key] = { connectionId, voice };
          } else {
            delete nextChars[key];
          }
          this.ttsEngine!.updateSettings({ characters: nextChars });
        }

        saveBtn.textContent = "✓ Saved!";
        setTimeout(() => { saveBtn.textContent = "Save Voice"; }, 1500);
      });

      testBtn.addEventListener("click", () => {
        const testText = isNarrator
          ? "The morning light filtered through the quiet room."
          : `Hello, my name is ${displayName}.`;
        void this.ttsEngine!.speak(testText, displayName);
      });
    }

    this.root.appendChild(container);
  }
}
