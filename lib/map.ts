import type { SkySpecification } from "maplibre-gl";

export const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE_URL || "https://tiles.openfreemap.org/styles/liberty";

export const MAP_SKY: SkySpecification = {
  "atmosphere-blend": [
    "interpolate",
    ["linear"],
    ["zoom"],
    0,
    0.42,
    3,
    0.2,
    6,
    0
  ],
  "fog-ground-blend": 0.18,
  "fog-color": "#c4d5e6",
  "horizon-color": "#8eb8d7",
  "sky-color": "#091827",
  "sky-horizon-blend": 0.28
};

export const INITIAL_VIEW_STATE = {
  latitude: 18,
  longitude: 8,
  zoom: 1.55,
  bearing: 0,
  pitch: 0
};

export const MAP_MIN_ZOOM = 0.75;
export const MAP_MAX_ZOOM = 13.8;
