export type LngLat = [number, number];

export interface MapInitOptions {
  style: string;
  center?: LngLat;
  zoom?: number;
  pitch?: number;
  bearing?: number;
  canvasContextAttributes?: WebGLContextAttributes;
  workerUrl?: string;
}

export type CampusFeatureType = "building" | "area" | "device" | "road";

export interface CampusFeature {
  id: string;
  name: string;
  type: CampusFeatureType;
  properties: Record<string, unknown>;
  center?: LngLat;
}

export type FeatureClickHandler = (feature: CampusFeature) => void;

export interface Disposable {
  dispose(): void;
}
