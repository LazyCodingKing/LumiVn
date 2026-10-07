export interface ChoiceOption {
  label: string;
  action: string;
}

export class ChoiceModal {
  public root: HTMLElement;
  private choicesContainer: HTMLElement;
  private promptTitle: HTMLElement;
  private onSelect: (action: string) => void;

  constructor(onSelect: (action: string) => void) {
    this.onSelect = onSelect;
    this.root = document.createElement("div");
    this.root.className = "vn-choice-overlay";
    this.root.style.display = "none";

    const modal = document.createElement("div");
    modal.className = "vn-choice-modal";

    this.promptTitle = document.createElement("div");
    this.promptTitle.className = "vn-choice-title";
    this.promptTitle.textContent = "Make your choice";

    this.choicesContainer = document.createElement("div");
    this.choicesContainer.className = "vn-choice-list";

    modal.appendChild(this.promptTitle);
    modal.appendChild(this.choicesContainer);
    this.root.appendChild(modal);
  }

  public show(choices: ChoiceOption[], prompt = "Make your choice"): void {
    this.promptTitle.textContent = prompt;
    this.choicesContainer.innerHTML = "";

    const pills = ["A", "B", "C", "D", "E", "F"];

    choices.forEach((choice, idx) => {
      const pill = pills[idx % pills.length]!;
      const btn = document.createElement("button");
      btn.className = "vn-galgame-choice-btn";
      btn.innerHTML = `
        <span class="vn-choice-pill">${pill}</span>
        <span class="vn-choice-label">${choice.label}</span>
        <span class="vn-choice-arrow">▶</span>
      `;
      btn.addEventListener("click", () => {
        this.hide();
        this.onSelect(choice.action);
      });
      this.choicesContainer.appendChild(btn);
    });

    this.root.style.display = "flex";
  }

  public hide(): void {
    this.root.style.display = "none";
  }
}
