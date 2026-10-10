import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { CharactersTab } from "./tab-characters.js";
import { BPlotsTab } from "./tab-bplots.js";
import { WardrobeTab } from "./tab-wardrobe.js";
import { StatsTab } from "./tab-stats.js";
import { InventoryTab } from "./tab-inventory.js";
import { MapTab } from "./tab-map.js";
import { PhoneTab } from "./tab-phone.js";
import { JournalTab } from "./tab-journal.js";
import { SceneTab } from "./tab-scene.js";
import { DiagnosticsTab } from "./tab-diagnostics.js";
import type { SpriteTransform } from "../stage/sprite-transform.js";
import type { VnTtsEngine } from "../stage/tts-engine.js";

export type HudTabId =
  | "characters"
  | "bplots"
  | "wardrobe"
  | "stats"
  | "inventory"
  | "map"
  | "phone"
  | "journal"
  | "scene"
  | "diagnostics";

export interface MenuBarOptions {
  ctx: SpindleFrontendContext;
  onAction: (actionText: string) => void;
  onTransformChange?: (actorId: string, transform: SpriteTransform) => void;
  isOverlayActive?: () => boolean;
  ttsEngine?: VnTtsEngine;
}

export class MenuBar {
  public root: HTMLElement;
  private panelOverlay: HTMLElement;
  private panelBody: HTMLElement;
  private phoneBadge: HTMLElement | null = null;

  private charactersTab: CharactersTab;
  private bplotsTab: BPlotsTab;
  private wardrobeTab: WardrobeTab;
  private statsTab: StatsTab;
  private inventoryTab: InventoryTab;
  private mapTab: MapTab;
  private phoneTab: PhoneTab;
  private journalTab: JournalTab;
  private sceneTab: SceneTab;
  private diagnosticsTab: DiagnosticsTab;

  private activeTabId: HudTabId | null = null;
  private currentLedger: LedgerData = {};
  private currentManifest?: AssetManifest;

  constructor(options: MenuBarOptions) {
    this.root = document.createElement("div");
    this.root.className = "vn-hud-menubar";

    this.panelOverlay = document.createElement("div");
    this.panelOverlay.className = "vn-hud-overlay";
    this.panelOverlay.style.display = "none";

    const panelModal = document.createElement("div");
    panelModal.className = "vn-hud-modal";

    const closeBtn = document.createElement("button");
    closeBtn.className = "vn-hud-close-btn";
    closeBtn.textContent = "✕";
    closeBtn.addEventListener("click", () => this.closeTab());

    this.panelBody = document.createElement("div");
    this.panelBody.className = "vn-hud-panel-body";

    panelModal.appendChild(closeBtn);
    panelModal.appendChild(this.panelBody);
    this.panelOverlay.appendChild(panelModal);

    this.panelOverlay.addEventListener("click", (e) => {
      if (e.target === this.panelOverlay) this.closeTab();
    });

    // Instantiate tab views
    this.charactersTab = new CharactersTab(options.ttsEngine, options.ctx);
    this.bplotsTab = new BPlotsTab();
    this.wardrobeTab = new WardrobeTab(options.onAction);
    this.statsTab = new StatsTab();
    this.inventoryTab = new InventoryTab(options.onAction);
    this.mapTab = new MapTab(options.onAction);
    this.phoneTab = new PhoneTab(options.ctx, options.onAction, options.isOverlayActive);
    this.journalTab = new JournalTab();
    this.sceneTab = new SceneTab(options.ctx, options.onTransformChange);
    this.diagnosticsTab = new DiagnosticsTab(options.ctx);

    // Render bar buttons
    const barItems: Array<{ id: HudTabId; icon: string; label: string }> = [
      { id: "characters", icon: "👥", label: "Cast" },
      { id: "bplots", icon: "📡", label: "B-Plots" },
      { id: "wardrobe", icon: "👗", label: "Wardrobe" },
      { id: "stats", icon: "📊", label: "Stats" },
      { id: "inventory", icon: "🎒", label: "Inventory" },
      { id: "map", icon: "🗺️", label: "Map" },
      { id: "phone", icon: "📱", label: "Phone" },
      { id: "journal", icon: "📜", label: "Journal" },
      { id: "scene", icon: "🎬", label: "Scene" },
      { id: "diagnostics", icon: "📋", label: "Copy / Diag" },
    ];

    for (const item of barItems) {
      const btn = document.createElement("button");
      btn.className = "vn-hud-btn";
      btn.dataset.tabId = item.id;
      btn.innerHTML = `<span class="vn-hud-icon">${item.icon}</span><span class="vn-hud-label">${item.label}</span>`;

      if (item.id === "phone") {
        this.phoneBadge = document.createElement("span");
        this.phoneBadge.className = "vn-hud-badge";
        this.phoneBadge.textContent = "!";
        this.phoneBadge.style.display = "none";
        btn.appendChild(this.phoneBadge);
      }

      btn.addEventListener("click", () => {
        if (this.activeTabId === item.id) {
          this.closeTab();
        } else {
          this.openTab(item.id);
        }
      });

      this.root.appendChild(btn);
    }
  }

  public getOverlay(): HTMLElement {
    return this.panelOverlay;
  }

  public setLedger(ledger: LedgerData, hasBPlotNotification = false): void {
    const raw = ledger as any;
    if (raw && raw.ledger && typeof raw.ledger === "object" && !Array.isArray(raw.ledger)) {
      this.currentLedger = { ...raw.ledger, ...raw };
    } else {
      this.currentLedger = ledger || {};
    }

    if (this.phoneBadge) {
      this.phoneBadge.style.display = hasBPlotNotification ? "flex" : "none";
      if (hasBPlotNotification) {
        this.phoneBadge.classList.add("vn-pulse");
      } else {
        this.phoneBadge.classList.remove("vn-pulse");
      }
    }

    if (this.activeTabId) {
      this.renderActiveTab();
    }
  }

  public setManifest(manifest: AssetManifest): void {
    this.currentManifest = manifest;
    if (this.activeTabId === "characters" || this.activeTabId === "scene" || this.activeTabId === "map") {
      this.renderActiveTab();
    }
  }

  public setStatRulesSettings(settings: any): void {
    this.diagnosticsTab.setStatRulesSettings(settings);
  }

  public openTab(tabId: HudTabId): void {
    if (this.activeTabId === "phone" && tabId !== "phone") {
      this.phoneTab.close();
    }
    if (this.activeTabId === "diagnostics" && tabId !== "diagnostics") {
      this.diagnosticsTab.destroy();
    }
    this.activeTabId = tabId;
    this.renderActiveTab();
    this.panelOverlay.style.display = "flex";
  }

  public closeTab(): void {
    if (this.activeTabId === "phone") {
      this.phoneTab.close();
    }
    if (this.activeTabId === "diagnostics") {
      this.diagnosticsTab.destroy();
    }
    this.activeTabId = null;
    this.panelOverlay.style.display = "none";
  }

  private renderActiveTab(): void {
    this.panelBody.innerHTML = "";
    switch (this.activeTabId) {
      case "characters":
        this.charactersTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.charactersTab.root);
        break;
      case "bplots":
        this.bplotsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.bplotsTab.root);
        break;
      case "wardrobe":
        this.wardrobeTab.render(this.currentLedger);
        this.panelBody.appendChild(this.wardrobeTab.root);
        break;
      case "stats":
        this.statsTab.render(this.currentLedger);
        this.panelBody.appendChild(this.statsTab.root);
        break;
      case "inventory":
        this.inventoryTab.render(this.currentLedger);
        this.panelBody.appendChild(this.inventoryTab.root);
        break;
      case "map":
        this.mapTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.mapTab.root);
        break;
      case "phone":
        this.phoneTab.render(this.currentLedger);
        this.panelBody.appendChild(this.phoneTab.root);
        break;
      case "journal":
        this.journalTab.render(this.currentLedger);
        this.panelBody.appendChild(this.journalTab.root);
        break;
      case "scene":
        this.sceneTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.sceneTab.root);
        break;
      case "diagnostics":
        this.diagnosticsTab.render(this.currentLedger, this.currentManifest);
        this.panelBody.appendChild(this.diagnosticsTab.root);
        break;
    }
  }
}
