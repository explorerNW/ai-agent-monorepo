// =====================================================================
// 职责：Web Component 容器，负责挂载 Canvas、转发事件、生命周期管理
// =====================================================================
import { TwinCore, TwinConfig, BuildingData } from "@datatwin/core";

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
        .canvas-wrapper { width: 100%; height: 100%; touch-action: none; } /* 防止触摸时页面滚动 */
      </style>
      <div class="canvas-wrapper"></div>
    `;

    this.canvasWrapper = shadow.querySelector(".canvas-wrapper") as HTMLElement;
    const theme = (this.getAttribute("theme") as "dark" | "light") || "dark";

    if (this.canvasWrapper) {
      this.core = new TwinCore(this.canvasWrapper, { theme });

      this.interactionHandler = (e: Event) => {
        this.dispatchEvent(
          new CustomEvent("twin-interaction", {
            detail: (e as CustomEvent).detail,
            bubbles: true,
            composed: true,
          }),
        );
      };

      // ✅ 性能优化：添加 passive: true，提升滚动/触摸性能
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
    this.resizeObserver = null;
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (!this.core) return;
    if (name === "theme") {
      console.warn(
        "Dynamic theme switching requires a setTheme method in Core.",
      );
    }
  }

  // ✅ 暴露完整的命令式 API (包含批量注册)
  public registerBuilding(data: BuildingData) {
    this.core?.registerBuilding(data);
  }
  public registerBuildingsBatch(dataList: BuildingData[]) {
    this.core?.registerBuildingsBatch(dataList);
  }
  public flyTo(target: string) {
    this.core?.flyTo(target);
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
