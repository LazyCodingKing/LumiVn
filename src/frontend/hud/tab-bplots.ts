import type { LedgerData, BPlot, RosterCharacter, FrontNode, TravelNode, SceneLatent } from "../../shared/types.js";

export interface InterludeBeat {
  speaker: string;
  avatarIcon: string;
  text: string;
  type: "dialogue" | "action";
}

export function generateBondInterlude(
  actorA: { id: string; name?: string; loc?: string; status?: string; want?: string },
  actorB: { id: string; name?: string; loc?: string; status?: string; want?: string },
  placeName?: string
): InterludeBeat[] {
  const nameA = actorA.name || actorA.id;
  const nameB = actorB.name || actorB.id;
  const loc = placeName || actorA.loc || actorB.loc || "the district outskirts";

  return [
    {
      speaker: "Narrator",
      avatarIcon: "🎬",
      type: "action",
      text: `[Off-Screen Interlude: Meanwhile, at ${loc}... ${nameA} and ${nameB} meet quietly, away from the spotlight.]`,
    },
    {
      speaker: nameA,
      avatarIcon: "👤",
      type: "dialogue",
      text: actorA.status
        ? `"${nameB}, thank you for meeting me here. As you know, ${actorA.status}."`
        : `"${nameB}, do you have a moment? There is a matter between us that cannot wait."`,
    },
    {
      speaker: nameB,
      avatarIcon: "👥",
      type: "dialogue",
      text: actorB.want
        ? `"I hear you clearly. But my own agenda regarding ${actorB.want} remains just as urgent."`
        : `"I've been keeping an eye on things as well. Let us be plain about what is happening."`,
    },
    {
      speaker: nameA,
      avatarIcon: "👤",
      type: "dialogue",
      text: `"If we coordinate our moves now, neither of us will be blindsided by whatever comes next."`,
    },
    {
      speaker: nameB,
      avatarIcon: "👥",
      type: "dialogue",
      text: `"Agreed. Keep this between ourselves until the timing is right."`,
    },
  ];
}

export class BPlotsTab {
  public root: HTMLElement;
  private onAction?: (actionText: string) => void;
  private activeCutscene: { actorA: string; actorB: string; beats: InterludeBeat[]; currentBeat: number } | null = null;

  constructor(onAction?: (actionText: string) => void) {
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-bplots";
  }

  public render(ledger: LedgerData): void {
    this.root.innerHTML = "";
    this.root.style.cssText = "display: flex; flex-direction: column; gap: 14px; color: #f1f5f9; font-family: system-ui, sans-serif;";

    const bplots: BPlot[] = ledger.bplots || [];
    const roster: RosterCharacter[] = ledger.roster || [];
    const currentPlace = (ledger.scene?.place || "").toLowerCase();
    const offscreenCast = roster.filter((r) => {
      const isOffLOD = r.lod === 1 || r.lod === 2;
      const isDifferentLoc = r.loc && r.loc.toLowerCase() !== currentPlace;
      return (isOffLOD || isDifferentLoc) && (r.id || "").toLowerCase() !== "user";
    });
    const fronts: FrontNode[] = ledger.fronts || [];
    const travel: TravelNode[] = ledger.travel || [];
    const latents: SceneLatent[] = ledger.scene?.latents || [];

    // Header
    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
        <div>
          <h3 style="margin: 0; font-size: 15px; color: #f8fafc; display: flex; align-items: center; gap: 6px;">
            <span>📡</span> <span>B-Plots, Fronts & Offscreen Cast</span>
          </h3>
          <p class="vn-muted" style="margin: 2px 0 0 0; font-size: 11px;">
            Distant third-party agendas, active ripple stages, offscreen errands, and environmental fronts.
          </p>
        </div>
        <div style="display: flex; gap: 6px;">
          <span style="font-size: 11px; background: rgba(99,102,241,0.2); border: 1px solid #6366f1; padding: 2px 8px; border-radius: 6px; color: #c7d2fe;">
            ${bplots.length} B-Plots
          </span>
          <span style="font-size: 11px; background: rgba(56,189,248,0.2); border: 1px solid #38bdf8; padding: 2px 8px; border-radius: 6px; color: #7dd3fc;">
            ${offscreenCast.length} Offscreen Cast
          </span>
        </div>
      </div>
    `;
    this.root.appendChild(header);

    // ── 1. B-Plots Section ──
    const bpSection = document.createElement("div");
    bpSection.className = "vn-section";
    bpSection.innerHTML = `<h4>🌐 Active B-Plots & Distant Agendas (${bplots.length})</h4>`;

    if (bplots.length === 0) {
      bpSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">No external B-plots active on the ledger.</div>`;
    } else {
      const bpList = document.createElement("div");
      bpList.style.cssText = "display: flex; flex-direction: column; gap: 10px;";

      for (const bp of bplots) {
        const card = document.createElement("div");
        card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";

        const ripple = bp.ripple ?? 1;
        const rippleColor = ripple === 3 ? "#ef4444" : ripple === 2 ? "#f59e0b" : "#38bdf8";
        const rippleLabel = ripple === 3 ? "Stage 3: Collision" : ripple === 2 ? "Stage 2: Ambient Echo" : "Stage 1: Isolated";

        const knowsList = Array.isArray(bp.knows) ? bp.knows.join("; ") : bp.knows || "None";
        const hooksList = Array.isArray(bp.hooks) ? bp.hooks.join(", ") : bp.hooks || "None";
        const carriersList = (bp.carriers || []).map((c) => `${c.what || "News"} from ${c.from || "Source"} (ETA: ${c.eta || "?"})`).join("; ");

        card.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong style="color: #f8fafc; font-size: 13px;">${bp.who || bp.id || "Unknown Entity"}</strong>
              <span style="font-size: 10px; background: #0f172a; border: 1px solid #475569; padding: 1px 6px; border-radius: 4px; color: #94a3b8;">
                ${bp.scope || "personal"}
              </span>
              <span style="font-size: 10px; background: rgba(34,197,94,0.15); border: 1px solid #22c55e; padding: 1px 6px; border-radius: 4px; color: #86efac;">
                ${bp.status || "active"}
              </span>
            </div>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: ${rippleColor}22; border: 1px solid ${rippleColor}; color: ${rippleColor};">
              ${rippleLabel}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; font-size: 11px;">
            <div><span style="color: #94a3b8;">Want:</span> <strong style="color: #f8fafc;">${bp.want || "Unstated"}</strong></div>
            <div><span style="color: #94a3b8;">Current Activity:</span> <span style="color: #cbd5e1;">${bp.doing || "Routine"}</span></div>
          </div>

          ${bp.next ? `
            <div style="background: #0f172a; border-radius: 6px; padding: 6px 10px; font-size: 11px; display: flex; justify-content: space-between;">
              <span><strong style="color: #38bdf8;">Next Move:</strong> ${bp.next.move || "Advance plan"}</span>
              <span style="color: #fca5a5; font-weight: 600;">Due: ${bp.next.due || "TBD"}</span>
            </div>
          ` : ""}

          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: #cbd5e1;">
            ${bp.vector ? `<div><span style="color: #94a3b8;">Ripple Vector:</span> <em>${bp.vector}</em></div>` : ""}
            ${carriersList ? `<div><span style="color: #94a3b8;">Carriers & Outward News:</span> ${carriersList}</div>` : ""}
            <div><span style="color: #94a3b8;">Beliefs / What they know:</span> ${knowsList}</div>
            <div><span style="color: #94a3b8;">Scene Hooks:</span> <span style="color: #a78bfa;">${hooksList}</span></div>
          </div>
        `;
        bpList.appendChild(card);
      }
      bpSection.appendChild(bpList);
    }
    this.root.appendChild(bpSection);

    // ── 2. Offscreen Cast & Latents Section ──
    const offSection = document.createElement("div");
    offSection.className = "vn-section";
    offSection.innerHTML = `<h4>👥 Offscreen Cast & Area Latents (${offscreenCast.length + latents.length + travel.length})</h4>`;

    const offGrid = document.createElement("div");
    offGrid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px;";

    for (const actor of offscreenCast) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">${actor.name || actor.id}</strong>
          <span style="font-size: 10px; background: #0f172a; padding: 1px 6px; border-radius: 4px; color: #a5b4fc;">
            LOD ${actor.lod ?? 1}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Location:</span> <strong style="color: #f8fafc;">${actor.loc || "Unknown"}</strong></div>
        <div><span style="color: #94a3b8;">Status / Errand:</span> <span style="color: #cbd5e1;">${actor.status || "On routine"}</span></div>
        ${actor.tick !== undefined ? `<div style="font-size: 10px; color: #64748b;">Tick: ${actor.tick} | Record: ${actor.record || "normal"}</div>` : ""}
      `;
      offGrid.appendChild(card);
    }

    for (const lat of latents) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #6366f1; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #c084fc; font-size: 12px;">⏳ ${lat.who || lat.id} (Latent)</strong>
          <span style="font-size: 10px; background: rgba(139,92,246,0.2); color: #d8b4fe; padding: 1px 6px; border-radius: 4px;">
            ${lat.status || "pending"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Errand:</span> <span style="color: #f8fafc;">${lat.errand || "None"}</span></div>
        ${lat.route ? `<div><span style="color: #94a3b8;">Route:</span> ${lat.route}</div>` : ""}
        ${lat.window_opens ? `<div><span style="color: #94a3b8;">Window Opens:</span> <strong style="color: #fca5a5;">${lat.window_opens}</strong></div>` : ""}
      `;
      offGrid.appendChild(card);
    }

    for (const tr of travel) {
      const card = document.createElement("div");
      card.style.cssText = "background: #1e293b; border: 1px solid #38bdf8; border-radius: 8px; padding: 10px; font-size: 11px; display: flex; flex-direction: column; gap: 4px;";
      card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <strong style="color: #38bdf8; font-size: 12px;">🚶 ${tr.actor} (In Transit)</strong>
          <span style="font-size: 10px; background: rgba(56,189,248,0.2); color: #7dd3fc; padding: 1px 6px; border-radius: 4px;">
            ${tr.status || "en_route"}
          </span>
        </div>
        <div><span style="color: #94a3b8;">Route:</span> ${tr.from || "?"} ➔ ${tr.to || "?"}</div>
        <div><span style="color: #94a3b8;">Purpose:</span> ${tr.purpose || "Travel"}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 2px;">
          <span>Depart: ${tr.depart || "—"}</span>
          <span style="color: #fca5a5; font-weight: 600;">ETA: ${tr.eta || "—"}</span>
        </div>
      `;
      offGrid.appendChild(card);
    }

    if (offscreenCast.length === 0 && latents.length === 0 && travel.length === 0) {
      offSection.innerHTML += `<div class="vn-muted" style="padding: 10px; background: #0f172a; border-radius: 6px;">All tracked cast members are currently on the active scene.</div>`;
    } else {
      offSection.appendChild(offGrid);
    }
    this.root.appendChild(offSection);

    // ── 3. Bond Theater (Emergent NPC × NPC Cutscenes) ──
    const theaterSec = document.createElement("div");
    theaterSec.className = "vn-section";
    theaterSec.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <h4 style="margin: 0;">🎬 Bond Theater — NPC × NPC Offscreen Interlude</h4>
        <span style="font-size: 10px; color: #a5b4fc; background: rgba(99,102,241,0.2); padding: 2px 8px; border-radius: 4px;">Emergent Cutscene Player</span>
      </div>
    `;

    const allNpcCandidates = [
      ...offscreenCast.map((c) => ({ id: c.id, name: c.name || c.id, loc: c.loc, status: c.status, want: "" })),
      ...bplots.map((b) => ({ id: b.who || b.id || "Unknown", name: b.who || b.id, loc: "district", status: b.doing, want: b.want })),
    ];

    const uniqueNpcs = Array.from(new Map(allNpcCandidates.map((n) => [n.id, n])).values());

    if (uniqueNpcs.length < 2) {
      theaterSec.innerHTML += `
        <div class="vn-muted" style="padding: 12px; background: #0f172a; border-radius: 8px; border: 1px dashed #334155; font-size: 11px;">
          Bond Theater stages confidential side scenes when at least two offscreen actors or B-plot carriers are active in the world.
        </div>
      `;
    } else {
      const theaterCard = document.createElement("div");
      theaterCard.style.cssText =
        "background: #0f172a; border: 1px solid #6366f1; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.4);";

      theaterCard.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 11px; color: #94a3b8;">Actor 1:</span>
            <select id="vn-theater-actor-a" style="background: #1e293b; border: 1px solid #475569; color: #38bdf8; font-size: 11px; padding: 3px 8px; border-radius: 4px; outline: none; cursor: pointer;">
              ${uniqueNpcs.map((n) => `<option value="${n.id}">${n.name}</option>`).join("")}
            </select>
            <span style="font-size: 11px; color: #94a3b8;">×</span>
            <span style="font-size: 11px; color: #94a3b8;">Actor 2:</span>
            <select id="vn-theater-actor-b" style="background: #1e293b; border: 1px solid #475569; color: #c084fc; font-size: 11px; padding: 3px 8px; border-radius: 4px; outline: none; cursor: pointer;">
              ${uniqueNpcs.map((n, idx) => `<option value="${n.id}" ${idx === 1 ? "selected" : ""}>${n.name}</option>`).join("")}
            </select>
          </div>
          <button id="vn-start-theater-btn" style="background: linear-gradient(135deg, #4f46e5, #6366f1); border: none; color: #fff; font-size: 11px; font-weight: 700; padding: 5px 14px; border-radius: 6px; cursor: pointer; box-shadow: 0 2px 8px rgba(99,102,241,0.4);">
            ▶ Watch Interlude
          </button>
        </div>

        <div id="vn-theater-stage-box" style="display: flex; flex-direction: column; gap: 8px;">
          <div style="color: #94a3b8; font-size: 11px; font-style: italic; padding: 10px; text-align: center;">
            Select two actors above and click "Watch Interlude" to listen into their offscreen conversation.
          </div>
        </div>
      `;

      theaterSec.appendChild(theaterCard);

      const stageBox = theaterCard.querySelector("#vn-theater-stage-box") as HTMLElement;
      const startBtn = theaterCard.querySelector("#vn-start-theater-btn") as HTMLButtonElement;
      const selectA = theaterCard.querySelector("#vn-theater-actor-a") as HTMLSelectElement;
      const selectB = theaterCard.querySelector("#vn-theater-actor-b") as HTMLSelectElement;

      startBtn?.addEventListener("click", () => {
        const idA = selectA.value;
        const idB = selectB.value;
        const npcA = uniqueNpcs.find((n) => n.id === idA) || uniqueNpcs[0]!;
        const npcB = uniqueNpcs.find((n) => n.id === idB) || uniqueNpcs[1]!;

        const beats = generateBondInterlude(npcA, npcB, ledger.scene?.place);
        let currentBeatIdx = 0;

        const renderBeat = () => {
          stageBox.innerHTML = "";
          const beat = beats[currentBeatIdx]!;
          const isFinal = currentBeatIdx === beats.length - 1;

          const beatCard = document.createElement("div");
          beatCard.style.cssText =
            "background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 12px; display: flex; flex-direction: column; gap: 8px;";

          beatCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #334155; padding-bottom: 6px;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span style="font-size: 14px;">${beat.avatarIcon}</span>
                <strong style="color: ${beat.type === "action" ? "#a5b4fc" : "#38bdf8"}; font-size: 12px;">${beat.speaker}</strong>
              </div>
              <span style="font-size: 10px; color: #94a3b8;">Beat ${currentBeatIdx + 1} of ${beats.length}</span>
            </div>
            <div style="font-size: 12px; color: #f8fafc; line-height: 1.5; font-style: ${beat.type === "action" ? "italic" : "normal"};">
              ${beat.text}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 6px; border-top: 1px solid #334155;">
              <button id="vn-prev-beat-btn" style="background: transparent; border: 1px solid #475569; color: #cbd5e1; font-size: 10px; border-radius: 4px; padding: 3px 8px; cursor: ${currentBeatIdx > 0 ? "pointer" : "default"}; opacity: ${currentBeatIdx > 0 ? "1" : "0.4"};" ${currentBeatIdx === 0 ? "disabled" : ""}>
                ◀ Previous
              </button>
              <div style="display: flex; gap: 6px;">
                ${
                  isFinal
                    ? `
                  <button id="vn-share-intel-btn" style="background: linear-gradient(135deg, #059669, #10b981); border: none; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 4px 10px; cursor: pointer;">
                    📡 Share Intel to Story
                  </button>
                `
                    : `
                  <button id="vn-next-beat-btn" style="background: #6366f1; border: none; color: #fff; font-size: 10px; font-weight: 700; border-radius: 4px; padding: 4px 12px; cursor: pointer;">
                    Next Beat ▶
                  </button>
                `
                }
              </div>
            </div>
          `;

          stageBox.appendChild(beatCard);

          beatCard.querySelector("#vn-prev-beat-btn")?.addEventListener("click", () => {
            if (currentBeatIdx > 0) {
              currentBeatIdx -= 1;
              renderBeat();
            }
          });

          beatCard.querySelector("#vn-next-beat-btn")?.addEventListener("click", () => {
            if (currentBeatIdx < beats.length - 1) {
              currentBeatIdx += 1;
              renderBeat();
            }
          });

          beatCard.querySelector("#vn-share-intel-btn")?.addEventListener("click", () => {
            if (this.onAction) {
              const intelText = `[Bond Theater Intel: Overheard confidential meeting between ${npcA.name} and ${npcB.name} regarding their offscreen coordination.]`;
              this.onAction(intelText);
              const shareBtn = beatCard.querySelector("#vn-share-intel-btn") as HTMLButtonElement;
              if (shareBtn) {
                shareBtn.textContent = "✓ Intel Shared!";
                shareBtn.disabled = true;
              }
            }
          });
        };

        renderBeat();
      });
    }

    this.root.appendChild(theaterSec);

    // ── 3. Environmental Fronts Section ──
    if (fronts.length > 0) {
      const frontSec = document.createElement("div");
      frontSec.className = "vn-section";
      frontSec.innerHTML = `<h4>⚡ Environmental Fronts & Rising Tensions (${fronts.length})</h4>`;

      const fList = document.createElement("div");
      fList.style.cssText = "display: flex; flex-direction: column; gap: 8px;";

      for (const f of fronts) {
        const item = document.createElement("div");
        item.style.cssText = "background: #1e293b; border: 1px solid #334155; border-radius: 6px; padding: 8px 12px; font-size: 11px;";
        const press = f.pressure ?? 0;
        const pressColor = press >= 4 ? "#ef4444" : press >= 3 ? "#f59e0b" : "#38bdf8";

        item.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f8fafc; font-size: 12px;">${f.id}</strong>
            <span style="font-weight: 700; color: ${pressColor}; background: ${pressColor}22; border: 1px solid ${pressColor}; padding: 1px 6px; border-radius: 4px;">
              Pressure ${press}/5
            </span>
          </div>
          <div style="color: #cbd5e1; margin-bottom: 2px;">${f.cause || "Active pressure"}</div>
          <div style="display: flex; justify-content: space-between; color: #94a3b8; font-size: 10px;">
            <span>Stage: <strong>${f.stage || "initial"}</strong></span>
            ${f.due ? `<span>Due: <strong style="color: #fca5a5;">${f.due}</strong></span>` : ""}
            <span>Known by: ${(f.known_by || []).join(", ") || "None"}</span>
          </div>
        `;
        fList.appendChild(item);
      }
      frontSec.appendChild(fList);
      this.root.appendChild(frontSec);
    }
  }
}
