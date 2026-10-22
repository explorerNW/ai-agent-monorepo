import type { FeatureCollection } from "geojson";
import type {
  Map as MaplibreMap,
  MapMouseEvent,
  GeoJSONSource,
} from "maplibre-gl"; // 1. 引入 GeoJSONSource 类型
import type {
  CampusFeature,
  CampusFeatureType,
  FeatureClickHandler,
  Disposable,
} from "./types";

let layerIdCounter = 0;

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${layerIdCounter++}`;
}

export class CampusLayer implements Disposable {
  private map: MaplibreMap;
  private sourceId: string;
  private layerIds: string[] = [];
  private handler: FeatureClickHandler | null = null;
  private disposeClick: (() => void) | null = null;
  private removed = false;

  constructor(map: MaplibreMap, options?: { sourceId?: string }) {
    this.map = map;
    this.sourceId = options?.sourceId ?? uid("campus");
  }

  addGeoJSON(data: FeatureCollection) {
    if (this.removed) {
      throw new Error("CampusLayer has been removed");
    }

    const map = this.map;
    const source = map.getSource(this.sourceId);

    // 2. 如果源已存在，断言为 GeoJSONSource 并更新数据
    if (source) {
      // 确保它是 GeoJSONSource 类型，防止运行时错误
      if (source.type === "geojson") {
        (source as GeoJSONSource).setData(data);
      } else {
        console.warn(
          `Source ${this.sourceId} exists but is not a GeoJSON source.`,
        );
      }
      return;
    }

    // 3. 如果源不存在，创建新源
    map.addSource(this.sourceId, {
      type: "geojson",
      data,
    });

    const fillId = uid("campus-fill");
    const lineId = uid("campus-line");
    const extrusionId = uid("campus-extrusion");

    this.layerIds = [fillId, lineId, extrusionId];

    map.addLayer({
      id: fillId,
      type: "fill",
      source: this.sourceId,
      paint: {
        "fill-color": "#4a90d9",
        "fill-opacity": 0.25,
      },
    });

    map.addLayer({
      id: lineId,
      type: "line",
      source: this.sourceId,
      paint: {
        "line-color": "#4a90d9",
        "line-width": 2,
      },
    });

    map.addLayer({
      id: extrusionId,
      type: "fill-extrusion",
      source: this.sourceId,
      paint: {
        "fill-extrusion-color": "#4a6d88",
        "fill-extrusion-height": ["coalesce", ["get", "height"], 18],
        "fill-extrusion-base": ["coalesce", ["get", "base_height"], 0],
        "fill-extrusion-opacity": 0.85,
      },
    });
  }

  onFeatureClick(handler: FeatureClickHandler) {
    if (this.removed) {
      throw new Error("CampusLayer has been removed");
    }

    this.handler = handler;

    const onClick = (e: MapMouseEvent) => {
      const features = this.map.queryRenderedFeatures(e.point, {
        layers: this.layerIds,
      });

      if (!features.length) return;

      const props = features[0].properties ?? {};

      handler({
        id: String(props.id ?? ""),
        name: String(props.name ?? ""),
        type: (props.type as CampusFeatureType) ?? "building",
        properties: props,
      });
    };

    this.map.on("click", onClick);

    this.disposeClick = () => {
      this.map.off("click", onClick);
    };
  }

  setVisible(visible: boolean) {
    for (const id of this.layerIds) {
      if (!this.map.getLayer(id)) continue;

      if (visible) {
        this.map.setLayoutProperty(id, "visibility", "visible");
      } else {
        this.map.setLayoutProperty(id, "visibility", "none");
      }
    }
  }

  remove() {
    for (const id of this.layerIds) {
      if (this.map.getLayer(id)) {
        this.map.removeLayer(id);
      }
    }

    if (this.map.getSource(this.sourceId)) {
      this.map.removeSource(this.sourceId);
    }

    this.disposeClick?.();
    this.layerIds = [];
    this.removed = true;
  }

  dispose() {
    this.remove();
  }
}
