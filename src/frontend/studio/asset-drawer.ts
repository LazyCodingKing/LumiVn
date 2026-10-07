import type { SpindleFrontendContext, SpindleDrawerTabHandle } from "lumiverse-spindle-types";
import type { AssetManifest } from "../../shared/types.js";

export function registerAssetDrawer(ctx: SpindleFrontendContext): SpindleDrawerTabHandle | null {
  if (!ctx.ui?.registerDrawerTab) return null;

  const handle = ctx.ui.registerDrawerTab({
    id: "vn_asset_studio",
    title: "LumiVN Asset Studio",
    shortName: "VN Studio",
    description: "Manage local visual novel backgrounds, character paper-dolls, and sprite sheets.",
    iconSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  });

  const root = handle.root;
  root.innerHTML = `
    <div class="vn-studio-container" style="padding: 16px; font-family: system-ui, sans-serif; color: #f1f5f9; height: 100%; overflow-y: auto;">
      <h2 style="font-size: 18px; margin-bottom: 8px;">🎨 LumiVN Asset Studio</h2>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 16px;">
        Upload offline place backgrounds and character sprite layers directly to extension storage.
      </p>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Upload Place Background</h3>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input id="vn-place-id-input" type="text" placeholder="Place ID (e.g. courtyard)" style="flex: 1; padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <button id="vn-upload-place-btn" style="padding: 6px 14px; background: #6366f1; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;">Pick Media</button>
        </div>
        <div style="font-size: 11px; color: #64748b;">Supports PNG, WEBP, JPG, MP4, WEBM</div>
      </div>

      <div style="background: rgba(30, 41, 59, 0.7); border: 1px solid #334155; border-radius: 8px; padding: 14px; margin-bottom: 16px;">
        <h3 style="font-size: 14px; margin-bottom: 10px;">Upload Character Sprite / Layer</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 10px;">
          <input id="vn-char-actor-input" type="text" placeholder="Actor ID (e.g. alethea)" style="padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <input id="vn-char-outfit-input" type="text" placeholder="Outfit (default, uniform...)" style="padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
        </div>
        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
          <input id="vn-char-expr-input" type="text" placeholder="Expression/Layer (neutral, angry, base...)" style="flex: 1; padding: 6px 10px; background: #0f172a; border: 1px solid #475569; border-radius: 4px; color: #fff; font-size: 13px;" />
          <button id="vn-upload-char-btn" style="padding: 6px 14px; background: #8b5cf6; border: none; border-radius: 4px; color: #fff; font-weight: 600; cursor: pointer; font-size: 13px;">Pick Image</button>
        </div>
      </div>

      <div id="vn-manifest-view" style="background: rgba(15, 23, 42, 0.6); border: 1px solid #1e293b; border-radius: 8px; padding: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <h3 style="font-size: 14px;">Indexed Asset Manifest</h3>
          <button id="vn-refresh-manifest-btn" style="padding: 4px 10px; background: #334155; border: none; border-radius: 4px; color: #94a3b8; font-size: 12px; cursor: pointer;">Refresh</button>
        </div>
        <pre id="vn-manifest-json" style="font-size: 11px; color: #94a3b8; max-height: 200px; overflow-y: auto; background: #020617; padding: 8px; border-radius: 4px;"></pre>
      </div>
      <div id="vn-upload-status" style="margin-top: 12px; font-size: 12px; color: #38bdf8;"></div>
    </div>
  `;

  const statusEl = root.querySelector("#vn-upload-status") as HTMLElement;
  const manifestJsonEl = root.querySelector("#vn-manifest-json") as HTMLElement;

  const showStatus = (msg: string, isError = false) => {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.style.color = isError ? "#f43f5e" : "#38bdf8";
  };

  const getDrawerContextIds = () => {
    const ctxAny = ctx as any;
    const activeChat = ctxAny.getActiveChat?.();
    return {
      chatId: activeChat?.id || activeChat?.chatId,
      userId:
        ctxAny.user?.id ||
        ctxAny.currentUser?.id ||
        activeChat?.user_id ||
        activeChat?.userId,
    };
  };

  const uploadPlaceBtn = root.querySelector("#vn-upload-place-btn");
  uploadPlaceBtn?.addEventListener("click", async () => {
    const placeIdInput = root.querySelector("#vn-place-id-input") as HTMLInputElement;
    const placeId = (placeIdInput?.value || "").trim().toLowerCase();
    if (!placeId) {
      showStatus("Please enter a Place ID first", true);
      return;
    }

    try {
      const files = await ctx.uploads.pickFile({
        accept: ["image/*", "video/mp4", "video/webm"],
        multiple: false,
      });
      if (!files || files.length === 0) return;

      const file = files[0]!;
      showStatus(`Uploading ${file.name}...`);

      let binary = "";
      for (let i = 0; i < file.bytes.byteLength; i++) {
        binary += String.fromCharCode(file.bytes[i]!);
      }
      const dataUrl = `data:${file.mimeType || "application/octet-stream"};base64,${btoa(binary)}`;

      const { chatId: pChatId, userId: pUserId } = getDrawerContextIds();
      ctx.sendToBackend({
        type: "vn_upload_asset",
        category: "places",
        placeId,
        filename: file.name,
        dataUrl,
        chatId: pChatId,
        userId: pUserId,
      });
      showStatus(`Uploaded ${placeId} (${file.name}) successfully!`);
    } catch (e) {
      showStatus(`Upload error: ${String(e)}`, true);
    }
  });

  const uploadCharBtn = root.querySelector("#vn-upload-char-btn");
  uploadCharBtn?.addEventListener("click", async () => {
    const actorInput = root.querySelector("#vn-char-actor-input") as HTMLInputElement;
    const outfitInput = root.querySelector("#vn-char-outfit-input") as HTMLInputElement;
    const exprInput = root.querySelector("#vn-char-expr-input") as HTMLInputElement;

    const actor = (actorInput?.value || "").trim().toLowerCase();
    const outfit = (outfitInput?.value || "default").trim().toLowerCase();
    const expr = (exprInput?.value || "neutral").trim().toLowerCase();

    if (!actor) {
      showStatus("Please enter an Actor ID first", true);
      return;
    }

    try {
      const files = await ctx.uploads.pickFile({
        accept: ["image/png", "image/webp"],
        multiple: false,
      });
      if (!files || files.length === 0) return;

      const file = files[0]!;
      showStatus(`Uploading character layer...`);

      let binary = "";
      for (let i = 0; i < file.bytes.byteLength; i++) {
        binary += String.fromCharCode(file.bytes[i]!);
      }
      const dataUrl = `data:${file.mimeType || "image/png"};base64,${btoa(binary)}`;

      const { chatId: cChatId, userId: cUserId } = getDrawerContextIds();
      ctx.sendToBackend({
        type: "vn_upload_asset",
        category: "characters",
        actorId: actor,
        outfit,
        expression: expr,
        filename: file.name,
        dataUrl,
        chatId: cChatId,
        userId: cUserId,
      });
      showStatus(`Uploaded ${actor}/${outfit}/${expr} (${file.name}) successfully!`);
    } catch (e) {
      showStatus(`Upload error: ${String(e)}`, true);
    }
  });

  const refreshBtn = root.querySelector("#vn-refresh-manifest-btn");
  refreshBtn?.addEventListener("click", () => {
    ctx.sendToBackend({ type: "vn_get_manifest" });
  });

  // Request initial manifest
  ctx.sendToBackend({ type: "vn_get_manifest" });

  ctx.onBackendMessage((msg: unknown) => {
    const payload = msg as Record<string, unknown>;
    if (payload?.type === "vn_manifest" && manifestJsonEl) {
      manifestJsonEl.textContent = JSON.stringify(payload.manifest, null, 2);
    }
  });

  return handle;
}
