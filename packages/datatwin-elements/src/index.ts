// =====================================================================
// 职责：Web Component 容器，负责挂载 Canvas、转发事件、生命周期管理
// =====================================================================
import { BuildingData, TwinCore } from "@datatwin/core";

// =====================================================================
export class TwinViewerElement extends HTMLElement {
  private core: TwinCore | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private canvasWrapper: HTMLElement | null = null;
  private interactionHandler: ((e: Event) => void) | null = null;

  static get observedAttributes() {
    return ["theme"];
  }

  connectedCallback() {
    const shadow = this.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { display: block; width: 100%; height: 100%; position: relative; overflow: hidden; }
        .canvas-wrapper { width: 100%; height: 100%; touch-action: none; }
      </style>
      <div class="canvas-wrapper"></div>
    `;

    this.canvasWrapper = shadow.querySelector(".canvas-wrapper") as HTMLElement;
    const theme = (this.getAttribute("theme") as "dark" | "light") || "dark";

    if (this.canvasWrapper) {
      this.core = new TwinCore(this.canvasWrapper, theme);

      this.interactionHandler = (e: Event) => {
        this.dispatchEvent(
          new CustomEvent("twin-interaction", {
            detail: (e as CustomEvent).detail,
            bubbles: true,
            composed: true,
          }),
        );
      };

      this.canvasWrapper.addEventListener(
        "twin-interaction",
        this.interactionHandler,
        { passive: true },
      );
    }

    this.resizeObserver = new ResizeObserver(() => this.core?.resize());
    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    if (this.canvasWrapper && this.interactionHandler) {
      this.canvasWrapper.removeEventListener(
        "twin-interaction",
        this.interactionHandler,
      );
    }
    this.core?.dispose();
    this.core = null;
    this.resizeObserver?.disconnect();
  }

  // 暴露命令式 API
  public registerBuilding(data: BuildingData) {
    this.core?.registerBuilding(data);
  }
  public startMassiveSimulation(count: number) {
    this.core?.startMassiveSimulation(count);
  }

  public flyTo(targetName: string, duration?: number) {
    this.core?.flyTo(targetName, duration);
  }

  public resize() {
    this.core?.resize();
  }
  public dispose() {
    this.core?.dispose();
  }
}

if (!customElements.get("twin-viewer")) {
  customElements.define("twin-viewer", TwinViewerElement);
}
