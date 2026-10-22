import * as maplibregl from "maplibre-gl";
import type { MapInitOptions } from "./types";

export class MapLibreScene {
  private map: maplibregl.Map | null = null;
  private readyQueue: Array<(map: maplibregl.Map) => void> = [];
  private destroyed = false;

  init(container: string | HTMLElement, options: MapInitOptions) {
    if (this.destroyed) {
      throw new Error("MapLibreScene has been destroyed");
    }

    if (this.map) {
      return this.map;
    }

    const el =
      typeof container === "string"
        ? document.querySelector(container)
        : container;

    if (!el) {
      throw new Error("MapLibreScene: container not found");
    }

    if (options.workerUrl) {
      maplibregl.setWorkerUrl(options.workerUrl);
    }

    // this.map = new maplibregl.Map({
    //   container: el as HTMLElement,
    //   style: options.style,
    //   center: options.center ?? [111.7, 29.0],
    //   zoom: options.zoom ?? 14,
    //   pitch: options.pitch,
    //   bearing: options.bearing,
    //   canvasContextAttributes: options.canvasContextAttributes,
    // });

    this.map = new maplibregl.Map({
      container: el as HTMLElement,
      style: "https://tiles.openfreemap.org/styles/bright",
      center: [-74.5, 40],
      zoom: 9,
    });

    this.map.on("load", () => {
      for (const fn of this.readyQueue) {
        fn(this.map!);
      }
      this.readyQueue = [];
    });

    this.map.on("error", (err) => {
      console.error("[MapLibreScene] map error", err);
    });

    return this.map;
  }

  onReady(fn: (map: maplibregl.Map) => void) {
    if (!this.map) {
      this.readyQueue.push(fn);
      return;
    }

    if (this.map.isStyleLoaded()) {
      fn(this.map);
    } else {
      this.map.once("load", () => fn(this.map!));
    }
  }

  flyTo(options: {
    center?: [number, number];
    zoom?: number;
    pitch?: number;
    bearing?: number;
  }) {
    if (!this.map) return;

    this.map.flyTo({
      center: options.center,
      zoom: options.zoom,
      pitch: options.pitch,
      bearing: options.bearing,
    });
  }

  getMap() {
    return this.map;
  }

  destroy() {
    this.map?.remove();
    this.map = null;
    this.readyQueue = [];
    this.destroyed = true;
  }
}
