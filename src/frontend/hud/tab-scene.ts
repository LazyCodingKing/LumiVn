import type { SpindleFrontendContext } from "lumiverse-spindle-types";
import type { LedgerData, AssetManifest } from "../../shared/types.js";
import { resolveOutfitName } from "../../backend/asset-resolver.js";
import { getSpriteTransform, type SpriteTransform } from "../stage/sprite-transform.js";

export class SceneTab {
  public root: HTMLElement;
  private ctx: SpindleFrontendContext;
  private currentManifest?: AssetManifest;
  private onTransformChange?: (actorId: string, transform: SpriteTransform) => void;

  constructor(ctx: SpindleFrontendContext, onTransformChange?: (actorId: string, transform: SpriteTransform) => void) {
    this.ctx = ctx;
    this.onTransformChange = onTransformChange;
    this.root = document.createElement("div");
    this.root.className = "vn-hud-tab vn-tab-scene";
  }

  private getContextIds(): { chatId?: string; userId?: string } {
    const ctxAny = this.ctx as any;
    const activeChat = ctxAny.getActiveChat?.();
    return {
      chatId: activeChat?.id || activeChat?.chatId,
      userId: ctxAny.user?.id || ctxAny.currentUser?.id || activeChat?.user_id || activeChat?.userId,
    };
  }

  public setManifest(manifest: AssetManifest): void {
    this.currentManifest = manifest;
  }

  private async uploadImageFile(file: { name: string; bytes: Uint8Array; mimeType?: string }): Promise<string | null> {
    // Attempt direct HTTP upload to avoid multi-megabyte WebSocket IPC serialization
    try {
      const formData = new FormData();
      formData.append("file", new Blob([file.bytes as any], { type: file.mimeType || "image/png" }), file.name);
      const resp = await fetch("/api/v1/images", {
        method: "POST",
        body: formData,
      });
      if (resp.ok) {
        const data = await resp.json();
        const url = data.url || data.image_url || (data.id ? `/api/v1/images/${data.id}` : "");
        if (url) return url;
      }
    } catch {
      // Fallback if host direct fetch is unavailable
    }
    return null;
  }

  private async fileToDataUrl(file: { bytes: Uint8Array; mimeType?: string }): Promise<string> {
    let binary = "";
    for (let i = 0; i < file.bytes.byteLength; i++) {
      binary += String.fromCharCode(file.bytes[i]!);
    }
    return `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;
  }

  public render(ledger: LedgerData, manifest?: AssetManifest): void {
    if (manifest) this.currentManifest = manifest;
    this.root.innerHTML = "";
    const placeId = (ledger.scene?.place || "default").toLowerCase().trim();
    const participants = (ledger.scene?.participants || []).filter((p) => p && p.toLowerCase() !== "user");

    const header = document.createElement("div");
    header.className = "vn-tab-header";
    header.innerHTML = `<h3>🎬 Scene Visuals, Custom Poses & Gallery</h3>`;
    this.root.appendChild(header);

    // ── 1. Scoped Background Upload Section ──
    const bgSec = document.createElement("div");
    bgSec.className = "vn-section";
    bgSec.innerHTML = `
      <h4>Scene Background</h4>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">
        Tag your location with a Scope (e.g. house name or district) to prevent room collisions.
      </p>
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:8px; margin-bottom:8px;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Scope / Building (Optional):</label>
          <input id="vn-bg-scope" type="text" placeholder="e.g. tendo_residence" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Room / Location:</label>
          <input id="vn-bg-place" type="text" value="${placeId}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
      </div>
    `;

    const bgUploadBtn = document.createElement("button");
    bgUploadBtn.className = "vn-btn vn-btn-primary";
    bgUploadBtn.textContent = `📁 Upload Background Media`;
    bgUploadBtn.addEventListener("click", async () => {
      const scope = (bgSec.querySelector("#vn-bg-scope") as HTMLInputElement).value.trim();
      const place = (bgSec.querySelector("#vn-bg-place") as HTMLInputElement).value.trim() || placeId;

      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/*", "video/mp4", "video/webm"],
          multiple: false,
        });
        if (!files || files.length === 0) return;
        const file = files[0]!;

        const { chatId, userId } = this.getContextIds();
        const directUrl = await this.uploadImageFile(file);

        if (directUrl) {
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "places",
            scope,
            placeId: place,
            filename: file.name,
            url: directUrl,
            chatId,
            userId,
          });
        } else {
          const dataUrl = await this.fileToDataUrl(file);
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "places",
            scope,
            placeId: place,
            filename: file.name,
            dataUrl,
            chatId,
            userId,
          });
        }
      } catch (err) {
        console.error("[LumiVN] Background upload failed:", err);
      }
    });

    bgSec.appendChild(bgUploadBtn);
    this.root.appendChild(bgSec);

    // ── 2. Character Sprites & Custom Expressions ──
    const charSec = document.createElement("div");
    charSec.className = "vn-section";
    charSec.innerHTML = `<h4>Character Sprites & Custom Expressions</h4>`;

    if (participants.length === 0) {
      charSec.innerHTML += `<div class="vn-muted">No characters active in current scene.</div>`;
    } else {
      for (const rawActorId of participants) {
        const actorId = rawActorId.toLowerCase().trim();
        const actorDossier = ledger.actors?.[rawActorId] || ledger.actors?.[actorId];
        const currentOutfit = resolveOutfitName(actorDossier);

        const card = document.createElement("div");
        card.style.cssText = "background:#1e293b; border:1px solid #334155; border-radius:10px; padding:12px; margin-bottom:12px;";
        card.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <strong style="color:#f8fafc; font-size:14px;">${actorDossier?.name || rawActorId}</strong>
            <span style="font-size:11px; background:#0f172a; padding:3px 8px; border-radius:6px; color:#38bdf8;">
              Outfit: <strong>${currentOutfit}</strong>
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
            <div>
              <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Outfit Name:</label>
              <input class="vn-input-outfit" type="text" value="${currentOutfit}" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
            </div>
            <div>
              <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Custom Expression:</label>
              <input class="vn-input-expr" type="text" placeholder="e.g. smirk, pout, blush" value="neutral" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
            </div>
          </div>
        `;

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";

        const uploadSpriteBtn = document.createElement("button");
        uploadSpriteBtn.className = "vn-btn vn-btn-sm vn-btn-primary";
        uploadSpriteBtn.textContent = `📁 Upload Expression Sprite`;
        uploadSpriteBtn.addEventListener("click", async () => {
          const outfit = (card.querySelector(".vn-input-outfit") as HTMLInputElement).value.trim().toLowerCase();
          const expression = (card.querySelector(".vn-input-expr") as HTMLInputElement).value.trim().toLowerCase() || "neutral";

          try {
            const files = await this.ctx.uploads.pickFile({
              accept: ["image/png", "image/webp", "image/jpeg"],
              multiple: false,
            });
            if (!files || files.length === 0) return;
            const file = files[0]!;

            const { chatId, userId } = this.getContextIds();
            const directUrl = await this.uploadImageFile(file);

            if (directUrl) {
              this.ctx.sendToBackend({
                type: "vn_upload_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                filename: file.name,
                url: directUrl,
                chatId,
                userId,
              });
            } else {
              const dataUrl = await this.fileToDataUrl(file);
              this.ctx.sendToBackend({
                type: "vn_upload_asset",
                category: "characters",
                actorId,
                outfit,
                expression,
                filename: file.name,
                dataUrl,
                chatId,
                userId,
              });
            }
          } catch (e) {
            console.error("[LumiVN] Sprite upload failed:", e);
          }
        });

        btnRow.appendChild(uploadSpriteBtn);
        card.appendChild(btnRow);

        // ── Sprite Size & Positioning Alignment ──
        const transform = getSpriteTransform(actorId);
        const transformBox = document.createElement("div");
        transformBox.style.cssText = "background:#0f172a; border:1px solid #334155; border-radius:8px; padding:10px; margin-top:10px;";
        transformBox.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <span style="font-size:12px; font-weight:700; color:#38bdf8;">📐 Size & Position Alignment</span>
            <button class="vn-btn-reset" style="background:#334155; border:none; border-radius:4px; color:#cbd5e1; font-size:10px; padding:2px 8px; cursor:pointer;">↺ Reset</button>
          </div>
          <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:8px;">
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Scale (Size):</span> <strong class="vn-val-scale" style="color:#f8fafc;">${Math.round(transform.scale * 100)}%</strong>
              </label>
              <input class="vn-slider-scale" type="range" min="50" max="200" step="5" value="${Math.round(transform.scale * 100)}" style="width:100%; cursor:pointer;" />
            </div>
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Horizontal (X):</span> <strong class="vn-val-x" style="color:#f8fafc;">${transform.offsetX}px</strong>
              </label>
              <input class="vn-slider-x" type="range" min="-160" max="160" step="2" value="${transform.offsetX}" style="width:100%; cursor:pointer;" />
            </div>
            <div>
              <label style="font-size:10px; color:#94a3b8; display:flex; justify-content:space-between; margin-bottom:2px;">
                <span>Vertical (Y):</span> <strong class="vn-val-y" style="color:#f8fafc;">${transform.offsetY}px</strong>
              </label>
              <input class="vn-slider-y" type="range" min="-160" max="160" step="2" value="${transform.offsetY}" style="width:100%; cursor:pointer;" />
            </div>
          </div>
        `;

        const scaleInput = transformBox.querySelector(".vn-slider-scale") as HTMLInputElement;
        const xInput = transformBox.querySelector(".vn-slider-x") as HTMLInputElement;
        const yInput = transformBox.querySelector(".vn-slider-y") as HTMLInputElement;
        const scaleVal = transformBox.querySelector(".vn-val-scale") as HTMLElement;
        const xVal = transformBox.querySelector(".vn-val-x") as HTMLElement;
        const yVal = transformBox.querySelector(".vn-val-y") as HTMLElement;
        const resetBtn = transformBox.querySelector(".vn-btn-reset") as HTMLButtonElement;

        const updateTransform = () => {
          const scale = Number(scaleInput.value) / 100;
          const offsetX = Number(xInput.value);
          const offsetY = Number(yInput.value);
          scaleVal.textContent = `${Math.round(scale * 100)}%`;
          xVal.textContent = `${offsetX}px`;
          yVal.textContent = `${offsetY}px`;
          this.onTransformChange?.(actorId, { scale, offsetX, offsetY });
        };

        scaleInput.addEventListener("input", updateTransform);
        xInput.addEventListener("input", updateTransform);
        yInput.addEventListener("input", updateTransform);

        resetBtn.addEventListener("click", () => {
          scaleInput.value = "100";
          xInput.value = "0";
          yInput.value = "0";
          updateTransform();
        });

        card.appendChild(transformBox);
        charSec.appendChild(card);
      }
    }
    this.root.appendChild(charSec);

    // ── 3. Custom Actions & Event Poses ──
    const actionSec = document.createElement("div");
    actionSec.className = "vn-section";
    actionSec.innerHTML = `
      <h4>Custom Actions & Poses</h4>
      <p style="font-size:12px; color:#94a3b8; margin-bottom:10px;">
        Register unique sprites for specific verbs/actions (e.g. hug, punch, sword, blush).
      </p>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:10px;">
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Actor ID:</label>
          <input id="vn-action-actor" type="text" placeholder="e.g. alethea" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
        <div>
          <label style="font-size:11px; color:#94a3b8; display:block; margin-bottom:2px;">Action Keyword:</label>
          <input id="vn-action-name" type="text" placeholder="e.g. cast_spell, smile, hug" style="width:100%; box-sizing:border-box; background:#0f172a; border:1px solid #475569; border-radius:4px; padding:6px; color:#fff; font-size:12px;" />
        </div>
      </div>
    `;

    const actionBtnRow = document.createElement("div");
    actionBtnRow.style.cssText = "display: flex; gap: 8px; flex-wrap: wrap;";

    const uploadActionBtn = document.createElement("button");
    uploadActionBtn.className = "vn-btn vn-btn-primary";
    uploadActionBtn.textContent = `📁 Upload Action Pose Sprite`;
    uploadActionBtn.addEventListener("click", async () => {
      const actorId = (actionSec.querySelector("#vn-action-actor") as HTMLInputElement).value.trim().toLowerCase();
      const actionName = (actionSec.querySelector("#vn-action-name") as HTMLInputElement).value.trim().toLowerCase();

      if (!actorId || !actionName) {
        alert("Please specify both an Actor ID and Action Keyword.");
        return;
      }

      try {
        const files = await this.ctx.uploads.pickFile({
          accept: ["image/png", "image/webp", "image/jpeg"],
          multiple: false,
        });
        if (!files || files.length === 0) return;
        const file = files[0]!;

        const { chatId, userId } = this.getContextIds();
        const directUrl = await this.uploadImageFile(file);

        if (directUrl) {
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "actions",
            actorId,
            actionName,
            filename: file.name,
            url: directUrl,
            chatId,
            userId,
          });
        } else {
          const dataUrl = await this.fileToDataUrl(file);
          this.ctx.sendToBackend({
            type: "vn_upload_asset",
            category: "actions",
            actorId,
            actionName,
            filename: file.name,
            dataUrl,
            chatId,
            userId,
          });
        }
      } catch (err) {
        console.error("[LumiVN] Action upload failed:", err);
      }
    });

    actionBtnRow.appendChild(uploadActionBtn);
    actionSec.appendChild(actionBtnRow);
    this.root.appendChild(actionSec);

    // ── 4. Uploaded Assets Gallery with Delete ──
    const gallerySec = document.createElement("div");
    gallerySec.className = "vn-section";
    gallerySec.innerHTML = `<h4>📁 Uploaded Assets Manager</h4>`;

    const manifestData = this.currentManifest;
    const galleryList = document.createElement("div");
    galleryList.style.cssText = "display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px;";

    let assetCount = 0;

    // List Places
    if (manifestData?.places) {
      for (const [key, url] of Object.entries(manifestData.places)) {
        assetCount++;
        galleryList.appendChild(this.createAssetCard("places", `📍 Place: ${key}`, url, () => {
          this.deleteAsset({ category: "places", key });
        }));
      }
    }

    // List Character Outfits/Expressions
    if (manifestData?.characters) {
      for (const [actorId, actorData] of Object.entries(manifestData.characters)) {
        const outfits = actorData.outfits || (actorData as any);
        for (const [outfit, exprs] of Object.entries(outfits)) {
          if (exprs && typeof exprs === "object") {
            for (const [expr, url] of Object.entries(exprs as Record<string, string>)) {
              assetCount++;
              galleryList.appendChild(this.createAssetCard("characters", `👤 ${actorId} (${outfit}/${expr})`, url, () => {
                this.deleteAsset({ category: "characters", actorId, outfit, expression: expr });
              }));
            }
          }
        }

        // List Actions
        if (actorData.actions) {
          for (const [actionName, url] of Object.entries(actorData.actions)) {
            assetCount++;
            galleryList.appendChild(this.createAssetCard("actions", `⚡ ${actorId} [${actionName}]`, url, () => {
              this.deleteAsset({ category: "actions", actorId, actionName });
            }));
          }
        }
      }
    }

    if (assetCount === 0) {
      galleryList.innerHTML = `<div class="vn-muted">No custom uploaded assets found in manifest.</div>`;
    }

    gallerySec.appendChild(galleryList);
    this.root.appendChild(gallerySec);
  }

  private createAssetCard(category: string, title: string, url: string, onDelete: () => void): HTMLElement {
    const card = document.createElement("div");
    card.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#1e293b; border:1px solid #334155; border-radius:8px; padding:6px 10px;";
    card.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; overflow:hidden;">
        <img src="${url}" style="width:36px; height:36px; object-fit:cover; border-radius:4px; background:#0f172a;" alt="" onerror="this.style.display='none'" />
        <span style="font-size:12px; color:#f8fafc; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${title}</span>
      </div>
      <button class="vn-btn vn-btn-sm vn-btn-danger" style="padding:4px 8px; font-size:11px;">🗑️ Delete</button>
    `;

    card.querySelector("button")?.addEventListener("click", () => {
      if (confirm(`Remove this asset (${title})?`)) {
        onDelete();
      }
    });

    return card;
  }

  private deleteAsset(params: Record<string, unknown>): void {
    const { chatId } = this.getContextIds();
    this.ctx.sendToBackend({
      type: "vn_delete_asset",
      ...params,
      chatId,
    });
  }
}
