export interface BacklogEntry {
  messageId: string;
  speaker: string;
  text: string;
  isUser: boolean;
}

export class BacklogModal {
  public root: HTMLElement;
  private entriesContainer: HTMLElement;
  private onEditRequest?: (messageId: string, currentText: string) => void;

  constructor(onEditRequest?: (messageId: string, currentText: string) => void) {
    this.onEditRequest = onEditRequest;
    this.root = document.createElement("div");
    this.root.className = "vn-backlog-overlay";
    this.root.style.display = "none";

    const modal = document.createElement("div");
    modal.className = "vn-backlog-modal";

    const header = document.createElement("div");
    header.className = "vn-backlog-header";
    header.innerHTML = `
      <div style="display:flex; align-items:center; gap:8px;">
        <span style="font-size:18px;">📜</span>
        <strong style="font-size:16px; color:var(--vn-accent, #ffd700);">Dialogue Backlog</strong>
      </div>
      <button class="vn-backlog-close-btn" style="background:transparent; border:none; color:#94a3b8; font-size:20px; cursor:pointer;">✕</button>
    `;

    this.entriesContainer = document.createElement("div");
    this.entriesContainer.className = "vn-backlog-list";

    modal.appendChild(header);
    modal.appendChild(this.entriesContainer);
    this.root.appendChild(modal);

    this.root.addEventListener("click", (e) => {
      if (e.target === this.root) this.close();
    });
    header.querySelector(".vn-backlog-close-btn")?.addEventListener("click", () => this.close());
  }

  public open(entries: BacklogEntry[]): void {
    this.entriesContainer.innerHTML = "";

    if (entries.length === 0) {
      this.entriesContainer.innerHTML = `<div style="text-align:center; padding:30px; color:#64748b;">No previous dialogue history.</div>`;
    } else {
      for (const entry of entries) {
        const item = document.createElement("div");
        item.className = `vn-backlog-item ${entry.isUser ? "vn-backlog-user" : "vn-backlog-ai"}`;
        item.innerHTML = `
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="color:${entry.isUser ? "#38bdf8" : "var(--vn-accent, #ffd700)"}; font-size:13px;">${entry.speaker}</strong>
            <button class="vn-btn-edit-line" style="background:transparent; border:none; color:#64748b; cursor:pointer; font-size:12px;" title="Edit this line">✏️</button>
          </div>
          <div style="font-size:14px; line-height:1.5; color:var(--vn-text, #f8fafc);">${entry.text}</div>
        `;

        item.querySelector(".vn-btn-edit-line")?.addEventListener("click", () => {
          this.onEditRequest?.(entry.messageId, entry.text);
        });

        this.entriesContainer.appendChild(item);
      }
    }

    this.root.style.display = "flex";
    this.entriesContainer.scrollTop = this.entriesContainer.scrollHeight;
  }

  public close(): void {
    this.root.style.display = "none";
  }
}
