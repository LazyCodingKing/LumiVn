import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData } from "../../shared/types.js";

export class PhoneTab {
  public root: HTMLElement;
  private ctx: SpindleFrontendContext;
  private onAction: (actionText: string) => void;
  private currentLedger: LedgerData = {};
  private activeApp: "home" | "messages" | "calls" | "bank" | "arcade" = "home";
  private selectedGame: "menu" | "shooter" | "racer" | "snake" = "menu";
  private selectedChatActor: string | null = null;
  private stopCurrentGame: (() => void) | null = null;

  constructor(ctx: SpindleFrontendContext, onAction: (actionText: string) => void) {
    this.ctx = ctx;
    this.onAction = onAction;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-phone";
  }

  public render(ledger: LedgerData): void {
    this.currentLedger = ledger;
    this.root.innerHTML = "";
    this.stopCurrentGame?.();
    this.stopCurrentGame = null;

    const phoneShell = document.createElement("div");
    phoneShell.style.cssText = `
      width: 330px;
      height: 580px;
      margin: 0 auto;
      background: #090a0f;
      border: 10px solid #1e2230;
      border-radius: 40px;
      position: relative;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), inset 0 0 10px rgba(0,0,0,0.8);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;

    // 1. Status Bar & Dynamic Island
    const clockTime = ledger.clock?.t?.split(" ")[1] || ledger.clock?.t || "12:00";
    const statusBar = document.createElement("div");
    statusBar.style.cssText = "height: 32px; display: flex; justify-content: space-between; align-items: center; padding: 0 18px; font-size: 11px; color: #f8fafc; z-index: 10;";
    statusBar.innerHTML = `
      <span>${clockTime}</span>
      <div style="width: 70px; height: 18px; background: #000; border-radius: 12px; display: flex; align-items: center; justify-content: center;">
        <span style="width: 6px; height: 6px; background: #22c55e; border-radius: 50%;"></span>
      </div>
      <span>5G ⚡98%</span>
    `;
    phoneShell.appendChild(statusBar);

    // 2. Active Screen Content
    const screenBody = document.createElement("div");
    screenBody.style.cssText = "flex: 1; overflow-y: auto; padding: 12px; display: flex; flex-direction: column;";

    if (this.activeApp === "home") {
      this.renderHomeScreen(screenBody);
    } else if (this.activeApp === "messages") {
      this.renderMessagesApp(screenBody);
    } else if (this.activeApp === "calls") {
      this.renderCallsApp(screenBody);
    } else if (this.activeApp === "bank") {
      this.renderBankApp(screenBody);
    } else if (this.activeApp === "arcade") {
      this.renderArcadeApp(screenBody);
    }

    phoneShell.appendChild(screenBody);

    // 3. Bottom Home Indicator Bar
    const homeBar = document.createElement("div");
    homeBar.style.cssText = "height: 24px; display: flex; justify-content: center; align-items: center; cursor: pointer;";
    homeBar.innerHTML = `<div style="width: 100px; height: 4px; background: #64748b; border-radius: 2px;"></div>`;
    homeBar.addEventListener("click", () => {
      this.stopCurrentGame?.();
      this.stopCurrentGame = null;
      this.activeApp = "home";
      this.selectedGame = "menu";
      this.render(this.currentLedger);
    });
    phoneShell.appendChild(homeBar);

    this.root.appendChild(phoneShell);
  }

  private renderHomeScreen(container: HTMLElement): void {
    // Stage 2 B-Plot notifications
    const ripples = (this.currentLedger.bplots || []).filter((b) => b.ripple === 2 && b.status === "active");

    let notifHtml = "";
    if (ripples.length > 0) {
      notifHtml = `
        <div style="background: rgba(244,63,94,0.2); border: 1px solid #f43f5e; border-radius: 12px; padding: 10px; margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 700; color: #f43f5e; margin-bottom: 2px;">🚨 EMERGENCY NOTIFICATION</div>
          ${ripples.map((r) => `<div style="font-size: 11px; color: #fff;"><strong>${r.who}:</strong> ${r.doing}${r.vector ? ` <span style="color: #94a3b8;">(${r.vector})</span>` : ""}</div>`).join("")}
        </div>
      `;
    }

    const clockTime = this.currentLedger.clock?.t?.split(" ")[1] || this.currentLedger.clock?.t || "12:00";
    const dateStr = this.currentLedger.clock?.date || "12-10-18";
    const locStr = this.currentLedger.clock?.location || "Unknown Location";
    const regionStr = this.currentLedger.clock?.region ? `, ${this.currentLedger.clock.region}` : "";
    const phaseStr = this.currentLedger.clock?.phase || "Day";

    container.innerHTML = `
      ${notifHtml}
      <div style="text-align: center; margin: 8px 0 16px 0; color: #f8fafc;">
        <div style="font-size: 32px; font-weight: 300; letter-spacing: -0.5px; line-height: 1;">${clockTime}</div>
        <div style="font-size: 11px; color: #94a3b8; margin-top: 4px;">${dateStr} • ${phaseStr}</div>
        <div style="font-size: 11px; color: #38bdf8; margin-top: 2px;">📍 ${locStr}${regionStr}</div>
      </div>
      <div style="flex: 1; display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; align-content: start; margin-top: 6px;">
        <div class="vn-phone-app-icon" data-app="messages" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #10b981; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💬</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Messages</span>
        </div>
        <div class="vn-phone-app-icon" data-app="calls" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #3b82f6; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">📞</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Phone</span>
        </div>
        <div class="vn-phone-app-icon" data-app="bank" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: #f59e0b; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px;">💳</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px;">Wallet</span>
        </div>
        <div class="vn-phone-app-icon" data-app="arcade" style="display: flex; flex-direction: column; align-items: center; cursor: pointer;">
          <div style="width: 54px; height: 54px; background: linear-gradient(135deg, #ec4899, #8b5cf6); border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 24px; box-shadow: 0 4px 12px rgba(236,72,153,0.4);">🎮</div>
          <span style="font-size: 11px; color: #fff; margin-top: 4px; font-weight: 700;">Arcade</span>
        </div>
      </div>
    `;

    container.querySelectorAll(".vn-phone-app-icon").forEach((el) => {
      el.addEventListener("click", () => {
        const app = el.getAttribute("data-app") as any;
        if (app) {
          this.activeApp = app;
          this.selectedGame = "menu";
          this.render(this.currentLedger);
        }
      });
    });
  }

  private renderMessagesApp(container: HTMLElement): void {
    const actors = this.currentLedger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");

    if (!this.selectedChatActor && actorIds.length > 0) {
      this.selectedChatActor = actorIds[0]!;
    }

    if (!this.selectedChatActor) {
      container.innerHTML = `<div class="vn-muted" style="text-align:center; margin-top: 40px;">No contacts saved.</div>`;
      return;
    }

    const currentNpc = actors[this.selectedChatActor];
    const npcName = currentNpc?.name || this.selectedChatActor;

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 10px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <select id="vn-phone-contact-select" style="background: #1e293b; color: #fff; border: 1px solid #475569; border-radius: 4px; font-size: 12px; padding: 2px 6px;">
          ${actorIds.map((id) => `<option value="${id}" ${id === this.selectedChatActor ? "selected" : ""}>${actors[id]?.name || id}</option>`).join("")}
        </select>
      </div>

      <div style="flex: 1; display: flex; flex-direction: column; justify-content: flex-end;">
        <div style="background: #1e2235; border-radius: 8px; padding: 10px; font-size: 12px; color: #cbd5e1; margin-bottom: 10px;">
          Direct messaging session active with <strong>${npcName}</strong>. Sending a text triggers an immediate in-character chat turn.
        </div>
      </div>

      <div style="display: flex; gap: 6px; margin-top: auto;">
        <input id="vn-phone-sms-input" type="text" placeholder="Type text message..." style="flex: 1; background: #1e293b; border: 1px solid #475569; border-radius: 8px; padding: 8px; color: #fff; font-size: 12px;" />
        <button id="vn-phone-send-sms" style="background: #10b981; border: none; border-radius: 8px; padding: 0 12px; color: #fff; font-weight: 700; cursor: pointer;">➤</button>
      </div>
    `;

    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });

    const select = container.querySelector("#vn-phone-contact-select") as HTMLSelectElement;
    select?.addEventListener("change", () => {
      this.selectedChatActor = select.value;
      this.renderMessagesApp(container);
    });

    const input = container.querySelector("#vn-phone-sms-input") as HTMLInputElement;
    const sendBtn = container.querySelector("#vn-phone-send-sms") as HTMLButtonElement;

    const sendSms = () => {
      const text = input.value.trim();
      if (!text) return;
      this.onAction(`*Texts ${npcName} on phone*: "${text}"`);
      input.value = "";
    };

    sendBtn?.addEventListener("click", sendSms);
    input?.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendSms();
    });
  }

  private renderCallsApp(container: HTMLElement): void {
    const actors = this.currentLedger.actors || {};
    const actorIds = Object.keys(actors).filter((id) => id.toLowerCase() !== "user");

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 10px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <strong style="color: #fff; font-size: 13px;">Contacts & Dial</strong>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${actorIds.map((id) => {
          const name = actors[id]?.name || id;
          return `
            <div style="background: #1e2235; border: 1px solid #2d334d; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 13px; color: #fff;">${name}</span>
              <button class="vn-phone-call-btn" data-target="${name}" style="background: #3b82f6; border: none; border-radius: 6px; padding: 4px 10px; color: #fff; font-size: 11px; cursor: pointer;">📞 Call</button>
            </div>
          `;
        }).join("")}
      </div>
    `;

    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });

    container.querySelectorAll(".vn-phone-call-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        if (target) this.onAction(`*Calls ${target} on phone*`);
      });
    });
  }

  private renderBankApp(container: HTMLElement): void {
    const userMoney = this.currentLedger.actors?.["user"]?.money || { in_hand: 0, in_bank: 0, currency: "$" };

    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 14px;">
        <button id="vn-phone-back" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Apps</button>
        <strong style="color: #fff; font-size: 13px;">Digital Banking</strong>
      </div>
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); border-radius: 12px; padding: 16px; margin-bottom: 14px; color: #fff;">
        <div style="font-size: 11px; opacity: 0.8;">Total Liquid Assets</div>
        <div style="font-size: 26px; font-weight: 800; margin: 4px 0;">${userMoney.currency || "$"}${userMoney.in_bank || 0}</div>
        <div style="font-size: 11px; opacity: 0.8;">Physical Cash in Hand: ${userMoney.currency || "$"}${userMoney.in_hand || 0}</div>
      </div>
      <div style="display: flex; gap: 8px;">
        <button id="vn-bank-atm-btn" style="flex: 1; background: #334155; border: none; border-radius: 8px; padding: 10px; color: #fff; font-size: 12px; cursor: pointer;">Withdraw Cash</button>
      </div>
    `;

    container.querySelector("#vn-phone-back")?.addEventListener("click", () => {
      this.activeApp = "home";
      this.render(this.currentLedger);
    });

    container.querySelector("#vn-bank-atm-btn")?.addEventListener("click", () => {
      this.onAction(`*Withdraws cash from bank account at ATM*`);
    });
  }

  // ── ARCADE GAMES SUITE ──
  private renderArcadeApp(container: HTMLElement): void {
    if (this.selectedGame === "menu") {
      container.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #2d334d; padding-bottom: 8px; margin-bottom: 14px;">
          <button id="vn-arcade-home-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Home</button>
          <strong style="color: #f472b6; font-size: 14px; letter-spacing: 0.5px;">🎮 Pocket Arcade</strong>
        </div>

        <div style="display: flex; flex-direction: column; gap: 12px;">
          <div class="vn-game-card" data-game="shooter" style="background: linear-gradient(135deg, #1e1b4b, #2e1065); border: 1px solid #a855f7; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🚀</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Star Striker</div>
              <div style="font-size: 11px; color: #c084fc; margin-top: 2px;">Vertical space shooter with lasers & alien waves!</div>
            </div>
            <span style="color: #a855f7; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="racer" style="background: linear-gradient(135deg, #451a03, #78350f); border: 1px solid #f97316; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🏎️</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Traffic Racer</div>
              <div style="font-size: 11px; color: #fdba74; margin-top: 2px;">3-lane high-speed highway dodge with nitro boost!</div>
            </div>
            <span style="color: #f97316; font-size: 18px;">▶</span>
          </div>

          <div class="vn-game-card" data-game="snake" style="background: linear-gradient(135deg, #064e3b, #047857); border: 1px solid #10b981; border-radius: 12px; padding: 14px; cursor: pointer; display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 32px;">🐍</div>
            <div style="flex: 1;">
              <div style="font-weight: 800; color: #f8fafc; font-size: 13px;">Retro Snake</div>
              <div style="font-size: 11px; color: #6ee7b7; margin-top: 2px;">Classic arcade grid snake with apples & score.</div>
            </div>
            <span style="color: #10b981; font-size: 18px;">▶</span>
          </div>
        </div>
      `;

      container.querySelector("#vn-arcade-home-btn")?.addEventListener("click", () => {
        this.activeApp = "home";
        this.render(this.currentLedger);
      });

      container.querySelectorAll(".vn-game-card").forEach((card) => {
        card.addEventListener("click", () => {
          const game = card.getAttribute("data-game") as any;
          if (game) {
            this.selectedGame = game;
            this.renderArcadeApp(container);
          }
        });
      });
      return;
    }

    if (this.selectedGame === "shooter") {
      this.initSpaceShooter(container);
    } else if (this.selectedGame === "racer") {
      this.initTrafficRacer(container);
    } else if (this.selectedGame === "snake") {
      this.initRetroSnake(container);
    }
  }

  // ── GAME 1: STAR STRIKER (SPACE SHOOTER) ──
  private initSpaceShooter(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #a855f7;">🚀 Star Striker</span>
        <span id="vn-shooter-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">Score: 0</span>
      </div>
      <canvas id="vn-shooter-canvas" width="280" height="320" style="background: #030712; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-btn-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">◀</button>
        <button id="vn-btn-fire" style="background: #dc2626; border: 1px solid #ef4444; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 800; font-size: 13px; cursor: pointer;">💥 FIRE</button>
        <button id="vn-btn-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; width: 60px; height: 38px; font-size: 18px; cursor: pointer;">▶</button>
      </div>
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ and Space / Fire to play</p>
    `;

    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });

    const canvas = container.querySelector("#vn-shooter-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let score = 0;
    let lives = 3;
    let gameOver = false;
    let playerX = 140;
    const playerSpeed = 4;
    let moveLeft = false;
    let moveRight = false;

    const bullets: Array<{ x: number; y: number }> = [];
    const enemies: Array<{ x: number; y: number; vx: number; hp: number }> = [];
    const stars: Array<{ x: number; y: number; speed: number }> = [];

    for (let i = 0; i < 25; i++) {
      stars.push({ x: Math.random() * 280, y: Math.random() * 320, speed: Math.random() * 1.5 + 0.5 });
    }

    let enemySpawnCounter = 0;
    let animId: number;

    const fireBullet = () => {
      if (gameOver) {
        // Restart game
        score = 0;
        lives = 3;
        gameOver = false;
        enemies.length = 0;
        bullets.length = 0;
        playerX = 140;
        return;
      }
      bullets.push({ x: playerX, y: 285 });
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveLeft = true;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveRight = true;
      }
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        fireBullet();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveLeft = false;
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        moveRight = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const btnLeft = container.querySelector("#vn-btn-left") as HTMLButtonElement;
    const btnRight = container.querySelector("#vn-btn-right") as HTMLButtonElement;
    const btnFire = container.querySelector("#vn-btn-fire") as HTMLButtonElement;

    btnLeft?.addEventListener("pointerdown", () => { moveLeft = true; });
    btnLeft?.addEventListener("pointerup", () => { moveLeft = false; });
    btnLeft?.addEventListener("pointerleave", () => { moveLeft = false; });
    btnRight?.addEventListener("pointerdown", () => { moveRight = true; });
    btnRight?.addEventListener("pointerup", () => { moveRight = false; });
    btnRight?.addEventListener("pointerleave", () => { moveRight = false; });
    btnFire?.addEventListener("click", fireBullet);

    const loop = () => {
      ctx.fillStyle = "#030712";
      ctx.fillRect(0, 0, 280, 320);

      // Stars
      ctx.fillStyle = "#475569";
      for (const s of stars) {
        ctx.fillRect(s.x, s.y, 1.5, 1.5);
        s.y += s.speed;
        if (s.y > 320) s.y = 0;
      }

      if (!gameOver) {
        if (moveLeft && playerX > 16) playerX -= playerSpeed;
        if (moveRight && playerX < 264) playerX += playerSpeed;

        // Player ship
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(playerX, 280);
        ctx.lineTo(playerX - 12, 305);
        ctx.lineTo(playerX + 12, 305);
        ctx.closePath();
        ctx.fill();

        // Engine glow
        ctx.fillStyle = "#f97316";
        ctx.fillRect(playerX - 3, 305, 6, 4);

        // Bullets
        ctx.fillStyle = "#f43f5e";
        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i]!;
          b.y -= 7;
          ctx.fillRect(b.x - 2, b.y, 4, 8);
          if (b.y < -10) bullets.splice(i, 1);
        }

        // Spawn Enemies
        enemySpawnCounter++;
        if (enemySpawnCounter > 35) {
          enemySpawnCounter = 0;
          enemies.push({ x: Math.random() * 240 + 20, y: -20, vx: (Math.random() - 0.5) * 1.5, hp: 1 });
        }

        // Enemies
        for (let i = enemies.length - 1; i >= 0; i--) {
          const e = enemies[i]!;
          e.y += 2.2;
          e.x += e.vx;
          if (e.x < 15 || e.x > 265) e.vx *= -1;

          ctx.fillStyle = "#a855f7";
          ctx.fillRect(e.x - 10, e.y - 10, 20, 16);
          ctx.fillStyle = "#fde047";
          ctx.fillRect(e.x - 6, e.y - 4, 3, 3);
          ctx.fillRect(e.x + 3, e.y - 4, 3, 3);

          // Bullet Collision
          for (let bi = bullets.length - 1; bi >= 0; bi--) {
            const b = bullets[bi]!;
            if (Math.abs(b.x - e.x) < 14 && Math.abs(b.y - e.y) < 14) {
              bullets.splice(bi, 1);
              enemies.splice(i, 1);
              score += 100;
              const scoreEl = container.querySelector("#vn-shooter-score");
              if (scoreEl) scoreEl.textContent = `Score: ${score}`;
              break;
            }
          }

          // Player Collision
          if (Math.abs(playerX - e.x) < 16 && Math.abs(290 - e.y) < 16) {
            enemies.splice(i, 1);
            lives--;
            if (lives <= 0) gameOver = true;
          }

          if (e.y > 330) enemies.splice(i, 1);
        }

        // HUD Lives
        ctx.fillStyle = "#f43f5e";
        ctx.font = "11px sans-serif";
        ctx.fillText(`❤️ × ${lives}`, 10, 20);
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, 280, 320);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 140, 140);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Final Score: ${score}`, 140, 170);
        ctx.fillStyle = "#38bdf8";
        ctx.font = "12px sans-serif";
        ctx.fillText("Tap FIRE to Restart", 140, 200);
        ctx.textAlign = "start";
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    this.stopCurrentGame = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }

  // ── GAME 2: TRAFFIC RACER (HIGHWAY DODGE) ──
  private initTrafficRacer(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #f97316;">🏎️ Traffic Racer</span>
        <span id="vn-racer-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">0m</span>
      </div>
      <canvas id="vn-racer-canvas" width="280" height="320" style="background: #1e293b; border: 1px solid #374151; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: flex; justify-content: center; gap: 8px; margin-top: 10px;">
        <button id="vn-racer-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">◀ Left Lane</button>
        <button id="vn-racer-nitro" style="background: #ea580c; border: 1px solid #f97316; border-radius: 8px; color: #fff; width: 80px; height: 38px; font-weight: 800; font-size: 12px; cursor: pointer;">🔥 NITRO</button>
        <button id="vn-racer-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; flex: 1; height: 38px; font-weight: 700; font-size: 14px; cursor: pointer;">Right Lane ▶</button>
      </div>
      <p style="font-size: 10px; color: #6b7280; text-align: center; margin-top: 6px;">Use ◀ / ▶ or buttons to steer</p>
    `;

    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });

    const canvas = container.querySelector("#vn-racer-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const lanes = [65, 140, 215];
    let currentLane = 1;
    let targetX = lanes[1]!;
    let playerX = targetX;
    let distance = 0;
    let speed = 4;
    let nitro = false;
    let gameOver = false;

    const traffic: Array<{ x: number; y: number; speed: number; color: string }> = [];
    const coins: Array<{ x: number; y: number }> = [];
    let roadDashY = 0;
    let animId: number;

    const steerLeft = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane > 0) currentLane--;
      targetX = lanes[currentLane]!;
    };
    const steerRight = () => {
      if (gameOver) {
        restart();
        return;
      }
      if (currentLane < 2) currentLane++;
      targetX = lanes[currentLane]!;
    };
    const restart = () => {
      gameOver = false;
      distance = 0;
      currentLane = 1;
      targetX = lanes[1]!;
      playerX = targetX;
      traffic.length = 0;
      coins.length = 0;
      speed = 4;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        steerLeft();
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        steerRight();
      }
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        nitro = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === " ") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        nitro = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    container.querySelector("#vn-racer-left")?.addEventListener("click", steerLeft);
    container.querySelector("#vn-racer-right")?.addEventListener("click", steerRight);
    const nitroBtn = container.querySelector("#vn-racer-nitro") as HTMLButtonElement;
    nitroBtn?.addEventListener("pointerdown", () => { nitro = true; });
    nitroBtn?.addEventListener("pointerup", () => { nitro = false; });
    nitroBtn?.addEventListener("pointerleave", () => { nitro = false; });

    let spawnTimer = 0;

    const loop = () => {
      ctx.fillStyle = "#334155";
      ctx.fillRect(0, 0, 280, 320);

      // Grass borders
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, 0, 20, 320);
      ctx.fillRect(260, 0, 20, 320);

      // Road dash lines
      roadDashY = (roadDashY + (nitro ? 9 : speed)) % 40;
      ctx.fillStyle = "#f8fafc";
      for (let y = -40 + roadDashY; y < 340; y += 40) {
        ctx.fillRect(102, y, 4, 20);
        ctx.fillRect(177, y, 4, 20);
      }

      if (!gameOver) {
        const curSpeed = nitro ? 8 : speed;
        distance += Math.floor(curSpeed);
        speed = 4 + Math.min(6, distance / 1500);

        const scoreEl = container.querySelector("#vn-racer-score");
        if (scoreEl) scoreEl.textContent = `${distance}m`;

        // Smooth player move
        playerX += (targetX - playerX) * 0.3;

        // Draw Player Car
        ctx.fillStyle = "#dc2626";
        ctx.fillRect(playerX - 12, 250, 24, 44);
        ctx.fillStyle = "#38bdf8"; // Windshield
        ctx.fillRect(playerX - 9, 260, 18, 10);
        ctx.fillStyle = "#0f172a"; // Wheels
        ctx.fillRect(playerX - 14, 255, 3, 10);
        ctx.fillRect(playerX + 11, 255, 3, 10);
        ctx.fillRect(playerX - 14, 280, 3, 10);
        ctx.fillRect(playerX + 11, 280, 3, 10);

        if (nitro) {
          ctx.fillStyle = "#f97316";
          ctx.fillRect(playerX - 6, 294, 12, 10);
        }

        // Spawn traffic
        spawnTimer++;
        if (spawnTimer > (nitro ? 30 : 45)) {
          spawnTimer = 0;
          const laneIdx = Math.floor(Math.random() * 3);
          const colors = ["#2563eb", "#059669", "#7c3aed", "#d97706"];
          traffic.push({
            x: lanes[laneIdx]!,
            y: -50,
            speed: Math.random() * 1.5 + 2,
            color: colors[Math.floor(Math.random() * colors.length)]!,
          });

          if (Math.random() > 0.5) {
            coins.push({ x: lanes[(laneIdx + 1) % 3]!, y: -30 });
          }
        }

        // Draw Traffic
        for (let i = traffic.length - 1; i >= 0; i--) {
          const t = traffic[i]!;
          t.y += curSpeed - t.speed;

          ctx.fillStyle = t.color;
          ctx.fillRect(t.x - 12, t.y, 24, 42);
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(t.x - 9, t.y + 12, 18, 8);

          // Collision Check
          if (Math.abs(playerX - t.x) < 20 && Math.abs(270 - (t.y + 21)) < 36) {
            gameOver = true;
          }

          if (t.y > 340) traffic.splice(i, 1);
        }

        // Draw Coins
        for (let i = coins.length - 1; i >= 0; i--) {
          const c = coins[i]!;
          c.y += curSpeed;

          ctx.fillStyle = "#ffd700";
          ctx.beginPath();
          ctx.arc(c.x, c.y, 7, 0, Math.PI * 2);
          ctx.fill();

          if (Math.abs(playerX - c.x) < 18 && Math.abs(270 - c.y) < 24) {
            distance += 150;
            coins.splice(i, 1);
          } else if (c.y > 340) {
            coins.splice(i, 1);
          }
        }
      } else {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, 280, 320);
        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 22px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("CRASHED!", 140, 140);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "14px sans-serif";
        ctx.fillText(`Distance: ${distance}m`, 140, 170);
        ctx.fillStyle = "#f97316";
        ctx.font = "12px sans-serif";
        ctx.fillText("Tap button to Restart", 140, 205);
        ctx.textAlign = "start";
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    this.stopCurrentGame = () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }

  // ── GAME 3: RETRO SNAKE ──
  private initRetroSnake(container: HTMLElement): void {
    container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <button id="vn-game-back-btn" style="background: transparent; border: none; color: #38bdf8; font-size: 12px; cursor: pointer;">◀ Games</button>
        <span style="font-size: 12px; font-weight: 800; color: #10b981;">🐍 Retro Snake</span>
        <span id="vn-snake-score" style="font-size: 12px; font-weight: 700; color: #ffd700;">Score: 0</span>
      </div>
      <canvas id="vn-snake-canvas" width="280" height="280" style="background: #064e3b; border: 2px solid #059669; border-radius: 8px; display: block; margin: 0 auto;"></canvas>
      <div style="display: grid; grid-template-columns: repeat(3, 44px); gap: 6px; justify-content: center; margin-top: 10px;">
        <div></div>
        <button id="vn-snake-up" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▲</button>
        <div></div>
        <button id="vn-snake-left" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">◀</button>
        <button id="vn-snake-down" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▼</button>
        <button id="vn-snake-right" style="background: #1f2937; border: 1px solid #4b5563; border-radius: 8px; color: #fff; height: 36px; font-size: 14px; cursor: pointer;">▶</button>
      </div>
    `;

    container.querySelector("#vn-game-back-btn")?.addEventListener("click", () => {
      this.selectedGame = "menu";
      this.renderArcadeApp(container);
    });

    const canvas = container.querySelector("#vn-snake-canvas") as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gridSize = 14;
    const tileCount = 20; // 280 / 14 = 20
    let snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
    let dx = 0;
    let dy = -1;
    let apple = { x: 5, y: 5 };
    let score = 0;
    let gameOver = false;
    let timerId: number;

    const spawnApple = () => {
      apple = {
        x: Math.floor(Math.random() * tileCount),
        y: Math.floor(Math.random() * tileCount),
      };
    };

    const restart = () => {
      snake = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];
      dx = 0;
      dy = -1;
      score = 0;
      gameOver = false;
      spawnApple();
      const scoreEl = container.querySelector("#vn-snake-score");
      if (scoreEl) scoreEl.textContent = `Score: ${score}`;
    };

    const setDir = (newDx: number, newDy: number) => {
      if (gameOver) {
        restart();
        return;
      }
      if (newDx !== -dx && newDy !== -dy) {
        dx = newDx;
        dy = newDy;
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(0, -1);
      }
      if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(0, 1);
      }
      if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(-1, 0);
      }
      if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        setDir(1, 0);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    container.querySelector("#vn-snake-up")?.addEventListener("click", () => setDir(0, -1));
    container.querySelector("#vn-snake-down")?.addEventListener("click", () => setDir(0, 1));
    container.querySelector("#vn-snake-left")?.addEventListener("click", () => setDir(-1, 0));
    container.querySelector("#vn-snake-right")?.addEventListener("click", () => setDir(1, 0));

    const tick = () => {
      if (!gameOver) {
        const head = { x: snake[0]!.x + dx, y: snake[0]!.y + dy };

        // Wall hit
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
          gameOver = true;
        }

        // Self hit
        for (const seg of snake) {
          if (seg.x === head.x && seg.y === head.y) {
            gameOver = true;
          }
        }

        if (!gameOver) {
          snake.unshift(head);

          // Eat apple
          if (head.x === apple.x && head.y === apple.y) {
            score += 10;
            const scoreEl = container.querySelector("#vn-snake-score");
            if (scoreEl) scoreEl.textContent = `Score: ${score}`;
            spawnApple();
          } else {
            snake.pop();
          }
        }
      }

      // Draw
      ctx.fillStyle = "#064e3b";
      ctx.fillRect(0, 0, 280, 280);

      // Apple
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(apple.x * gridSize + 1, apple.y * gridSize + 1, gridSize - 2, gridSize - 2);

      // Snake
      ctx.fillStyle = "#34d399";
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i]!;
        ctx.fillStyle = i === 0 ? "#6ee7b7" : "#10b981";
        ctx.fillRect(s.x * gridSize + 1, s.y * gridSize + 1, gridSize - 2, gridSize - 2);
      }

      if (gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, 280, 280);
        ctx.fillStyle = "#f87171";
        ctx.font = "bold 18px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", 140, 120);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "13px sans-serif";
        ctx.fillText(`Final Score: ${score}`, 140, 150);
        ctx.fillStyle = "#34d399";
        ctx.font = "11px sans-serif";
        ctx.fillText("Press any direction to restart", 140, 180);
        ctx.textAlign = "start";
      }
    };

    timerId = window.setInterval(tick, 120);

    this.stopCurrentGame = () => {
      clearInterval(timerId);
      window.removeEventListener("keydown", onKeyDown);
    };
  }
}
