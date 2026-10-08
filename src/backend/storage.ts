import type { SpindleAPI } from "lumiverse-spindle-types";
import type { AssetManifest, LedgerData, DirectorSettings, DirectorLogEntry } from "../shared/types.js";

const DEFAULT_MANIFEST: AssetManifest = {
  places: {},
  characters: {},
};

export const DEFAULT_DIRECTOR_SETTINGS: DirectorSettings = {
  systemPrompt: `You are LumiWorld, a private world-state director for an interactive Lumiverse chat.

Your job is to advance the world behind the next visible reply.

Do not recap what already happened. Do not restate recent dialogue. Do not explain lore. Do not open with character names or summaries.

Write only the next world-state directive:
- what changes in the environment, situation, systems, factions, observers, or hidden risk
- how that pressure forces NPCs to act now
- what the main model should show in the next reply
- what must remain unresolved or unrevealed

Use imperative language. Start with a verb such as "Make", "Let", "Have", "Keep", "Escalate", "Pressure", or "Treat".

The directive should feel like the world moving forward, not a recap of the scene.

Return only one private directive for the next visible reply. Do not write the visible assistant reply. Do not address the user. Do not mention LumiWorld, the controller, this prompt, or the directive.

Prefer JSON exactly like:
{"director_note":"...","thread_label":"optional short name of the specific story thread developed"}

Omit thread_label when no specific thread can be named. Plain text is acceptable if needed.`,
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
