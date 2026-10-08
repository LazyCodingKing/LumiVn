import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry } from "../shared/types.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
};

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  systemPrompt: [
    "[LumiVN Living World Director]",
    "- PLAYER AGENCY GUARD: Never write dialogue, physical reactions, or internal choices for the player character.",
    "- NPC AUTONOMY: Present NPCs must act on their own active want_now before accommodating {{user}}.",
    "- PERSISTENT SECRETS: NPCs must conceal guarded secrets until direct witnessed evidence forces exposure.",
    "- UNRESOLVED TENSION: Keep current scene friction active; do not rush to polite consensus.",
  ].join("\n"),
  userNotes: "",
  enabled: true,
};

export class StorageManager {
  private spindle: SpindleAPI;

  constructor(spindle: SpindleAPI) {
    this.spindle = spindle;
  }

  async getManifest(): Promise<AssetManifest> {
    try {
      const exists = await this.spindle.storage.exists("asset_manifest.json");
      if (exists) {
        const raw = await this.spindle.storage.read("asset_manifest.json");
        return JSON.parse(raw) as AssetManifest;
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read asset_manifest.json, using default:", e);
    }
    return { ...DEFAULT_MANIFEST };
  }

  async saveManifest(manifest: AssetManifest): Promise<void> {
    try {
      await this.spindle.storage.write("asset_manifest.json", JSON.stringify(manifest, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save asset_manifest.json:", e);
    }
  }

  async getChatState(chatId: string): Promise<LedgerData | null> {
    try {
      const path = `chats/${chatId}/state.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw) as LedgerData;
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read chat state for ${chatId}:`, e);
    }
    return null;
  }

  async saveChatState(chatId: string, state: LedgerData): Promise<void> {
    try {
      const dir = `chats/${chatId}`;
      if (!(await this.spindle.storage.exists(dir))) {
        await this.spindle.storage.mkdir(dir);
      }
      await this.spindle.storage.write(`${dir}/state.json`, JSON.stringify(state, null, 2));
    } catch (e) {
      console.error(`[LumiVN] Failed to save chat state for ${chatId}:`, e);
    }
  }

  async saveMediaFile(relPath: string, dataUrlOrBase64: string): Promise<string> {
    try {
      const parts = relPath.split("/");
      if (parts.length > 1) {
        let currentDir = "";
        for (let i = 0; i < parts.length - 1; i++) {
          currentDir = currentDir ? `${currentDir}/${parts[i]}` : parts[i]!;
          if (!(await this.spindle.storage.exists(currentDir))) {
            await this.spindle.storage.mkdir(currentDir);
          }
        }
      }

      // Convert data url / base64 to binary
      let base64 = dataUrlOrBase64;
      if (base64.includes(",")) {
        base64 = base64.split(",")[1] ?? "";
      }
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      await this.spindle.storage.writeBinary(relPath, bytes);
      return relPath;
    } catch (e) {
      console.error(`[LumiVN] Failed to save media file to ${relPath}:`, e);
      throw e;
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      return await this.spindle.storage.exists(path);
    } catch {
      return false;
    }
  }

  async getDirectorSettings(): Promise<DirectorSettings> {
    try {
      const exists = await this.spindle.storage.exists("director_settings.json");
      if (exists) {
        const raw = await this.spindle.storage.read("director_settings.json");
        return { ...DEFAULT_DIRECTOR_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn("[LumiVN] Failed to read director_settings.json, using defaults:", e);
    }
    return { ...DEFAULT_DIRECTOR_SETTINGS };
  }

  async saveDirectorSettings(settings: DirectorSettings): Promise<void> {
    try {
      await this.spindle.storage.write("director_settings.json", JSON.stringify(settings, null, 2));
    } catch (e) {
      console.error("[LumiVN] Failed to save director_settings.json:", e);
    }
  }

  async getDirectorLogs(chatId: string): Promise<DirectorLogEntry[]> {
    try {
      const path = `chats/${chatId}/director_logs.json`;
      const exists = await this.spindle.storage.exists(path);
      if (exists) {
        const raw = await this.spindle.storage.read(path);
        return JSON.parse(raw) as DirectorLogEntry[];
      }
    } catch (e) {
      console.warn(`[LumiVN] Failed to read director logs for ${chatId}:`, e);
    }
    return [];
  }

  async saveDirectorLogs(chatId: string, logs: DirectorLogEntry[]): Promise<void> {
    try {
      const dir = `chats/${chatId}`;
      if (!(await this.spindle.storage.exists(dir))) {
        await this.spindle.storage.mkdir(dir);
      }
      await this.spindle.storage.write(`${dir}/director_logs.json`, JSON.stringify(logs, null, 2));
    } catch (e) {
      console.error(`[LumiVN] Failed to save director logs for ${chatId}:`, e);
    }
  }
}
