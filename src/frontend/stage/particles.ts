export type ParticlePreset = "sakura" | "rain" | "snow" | "embers" | "dust" | "none";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  rotation?: number;
  vRot?: number;
  sway?: number;
  swaySpeed?: number;
}

export class ParticleEngine {
  public canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null = null;
  private animId: number | null = null;
  private particles: Particle[] = [];
  private currentPreset: ParticlePreset = "none";
  private width = 0;
  private height = 0;
  private resizeObserver: ResizeObserver | null = null;

  constructor() {
    this.canvas = document.createElement("canvas");
    this.canvas.className = "vn-particle-canvas";
    this.canvas.style.position = "absolute";
    this.canvas.style.inset = "0";
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "2";

    this.ctx = this.canvas.getContext("2d");

    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);

    // Initial size
    requestAnimationFrame(() => this.handleResize());
    window.addEventListener("resize", this.handleResize);
  }

  private handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect() || {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.width = rect.width || window.innerWidth;
    this.height = rect.height || window.innerHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  public setWeather(weatherOrPlace: string): void {
    const raw = (weatherOrPlace || "").toLowerCase();
    if (/rain|storm|drizzle|shower|thunder/i.test(raw)) {
      this.setPreset("rain");
    } else if (/snow|blizzard|frost|winter|ice/i.test(raw)) {
      this.setPreset("snow");
    } else if (/cherry|sakura|spring|petal|flower|garden/i.test(raw)) {
      this.setPreset("sakura");
    } else if (/fire|ember|flame|lava|ruins|burning|ash/i.test(raw)) {
      this.setPreset("embers");
    } else if (/night|star|space|mystic|magic|dust|sunlight/i.test(raw)) {
      this.setPreset("dust");
    } else {
      this.setPreset("none");
    }
  }

  public setPreset(preset: ParticlePreset): void {
    if (this.currentPreset === preset) return;
    this.currentPreset = preset;
    this.particles = [];

    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }

    if (preset === "none") {
      if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
      return;
    }

    this.initParticles();
    this.animId = requestAnimationFrame(this.loop);
  }

  private initParticles(): void {
    const count = this.currentPreset === "rain" ? 100
      : this.currentPreset === "sakura" ? 35
      : this.currentPreset === "snow" ? 60
      : this.currentPreset === "embers" ? 40
      : 30; // dust

    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle(true));
    }
  }

  private createParticle(randomY = false): Particle {
    const w = this.width || window.innerWidth;
    const h = this.height || window.innerHeight;
    const x = Math.random() * w;
    const y = randomY ? Math.random() * h : -20;

    switch (this.currentPreset) {
      case "rain":
        return {
          x,
          y,
          vx: -1.5,
          vy: 14 + Math.random() * 8,
          size: 15 + Math.random() * 12,
          alpha: 0.35 + Math.random() * 0.4,
          color: "rgba(180, 215, 255, ",
        };
      case "snow":
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 1.2,
          vy: 1 + Math.random() * 2,
          size: 2 + Math.random() * 3.5,
          alpha: 0.4 + Math.random() * 0.5,
          color: "rgba(255, 255, 255, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.02 + Math.random() * 0.03,
        };
      case "sakura":
        return {
          x,
          y,
          vx: 1 + Math.random() * 1.5,
          vy: 1.2 + Math.random() * 1.8,
          size: 6 + Math.random() * 6,
          alpha: 0.65 + Math.random() * 0.3,
          color: "rgba(255, 183, 197, ",
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 0.04,
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.03 + Math.random() * 0.03,
        };
      case "embers":
        return {
          x,
          y: randomY ? y : h + 10,
          vx: (Math.random() - 0.5) * 1.5,
          vy: -(1.5 + Math.random() * 2.5),
          size: 2 + Math.random() * 3,
          alpha: 0.6 + Math.random() * 0.4,
          color: Math.random() > 0.4 ? "rgba(255, 120, 40, " : "rgba(255, 210, 60, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.04 + Math.random() * 0.04,
        };
      case "dust":
      default:
        return {
          x,
          y,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: 1.5 + Math.random() * 2.5,
          alpha: 0.2 + Math.random() * 0.5,
          color: "rgba(255, 235, 180, ",
          sway: Math.random() * Math.PI * 2,
          swaySpeed: 0.01 + Math.random() * 0.02,
        };
    }
  }

  private loop(): void {
    if (this.currentPreset === "none" || !this.ctx) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]!;

      // Update position
      if (p.sway !== undefined && p.swaySpeed !== undefined) {
        p.sway += p.swaySpeed;
        p.x += p.vx + Math.sin(p.sway) * 0.8;
      } else {
        p.x += p.vx;
      }
      p.y += p.vy;

      if (p.rotation !== undefined && p.vRot !== undefined) {
        p.rotation += p.vRot;
      }

      // Render
      this.ctx.fillStyle = `${p.color}${p.alpha})`;

      if (this.currentPreset === "rain") {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1.5;
        this.ctx.strokeStyle = `${p.color}${p.alpha})`;
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x + p.vx * 2, p.y + p.size);
        this.ctx.stroke();
      } else if (this.currentPreset === "sakura" && p.rotation !== undefined) {
        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate(p.rotation);
        this.ctx.beginPath();
        // Petal shape
        this.ctx.ellipse(0, 0, p.size * 0.9, p.size * 0.45, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        // Circle / Glow
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Reset offscreen particles
      const isOffscreen = this.currentPreset === "embers"
        ? p.y < -20 || p.x < -20 || p.x > this.width + 20
        : p.y > this.height + 20 || p.x < -30 || p.x > this.width + 30;

      if (isOffscreen) {
        this.particles[i] = this.createParticle(false);
      }
    }

    this.animId = requestAnimationFrame(this.loop);
  }

  public destroy(): void {
    if (this.animId) cancelAnimationFrame(this.animId);
    window.removeEventListener("resize", this.handleResize);
    this.canvas.remove();
  }
}
