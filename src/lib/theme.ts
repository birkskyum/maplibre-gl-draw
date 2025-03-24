/* eslint comma-dangle: ["error", "always-multiline"] */

import type {
  CircleLayerSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
  SymbolLayerSpecification,
} from 'maplibre-gl';

const blue = "#3bb2d0";
const orange = "#fbb03b";
const white = "#fff";

export type ThemeLayerId =
  | "gl-draw-point-outer"
  | "gl-draw-vertex-outer"
  | "gl-draw-midpoint"
  | "gl-draw-vertex-inner"
  | "gl-draw-point-inner"
  | "gl-draw-polygon-fill"
  | "gl-draw-polygon-fill-static"
  | "gl-draw-polygon-fill-active"
  | "gl-draw-polygon-fill-inactive"
  | "gl-draw-polygon-stroke-static"
  | "gl-draw-polygon-stroke-active"
  | "gl-draw-polygon-stroke-inactive"
  | "gl-draw-polygon-midpoint"
  | "gl-draw-polygon-and-line-vertex-inactive"
  | "gl-draw-polygon-and-line-vertex-stroke-inactive"
  | "gl-draw-lines"
  | "gl-draw-line-static"
  | "gl-draw-line-active"
  | "gl-draw-line-inactive"
  | "gl-draw-point-static"
  | "gl-draw-point-active"
  | "gl-draw-point-inactive"
  | "gl-draw-point-stroke-active"
  | "gl-draw-point-point-stroke-inactive";

export type Theme = Array<
  (
     Partial<FillLayerSpecification>
    | Partial<LineLayerSpecification>
    | Partial<CircleLayerSpecification>
    | Partial<SymbolLayerSpecification>
  ) & { id: ThemeLayerId }
>;

export const theme: Theme = [
  // Polygons
  //   Solid fill
  //   Active state defines color
  {
    id: "gl-draw-polygon-fill",
    type: "fill",
    filter: ["all", ["==", "$type", "Polygon"]],
    paint: {
      "fill-color": ["case", ["==", ["get", "active"], "true"], orange, blue],
      "fill-opacity": 0.1,
    },
  },
  // Lines
  // Polygon
  //   Matches Lines AND Polygons
  //   Active state defines color
  {
    id: "gl-draw-lines",
    type: "line",
    filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
    layout: {
      "line-cap": "round",
      "line-join": "round",
    },
    paint: {
      "line-color": ["case", ["==", ["get", "active"], "true"], orange, blue],
      "line-dasharray": [0.2, 2],
      "line-width": 2,
    },
  },
  // Points
  //   Circle with an outline
  //   Active state defines size and color
  {
    id: "gl-draw-point-outer",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": white,
    },
  },
  {
    id: "gl-draw-point-inner",
    type: "circle",
    filter: ["all", ["==", "$type", "Point"], ["==", "meta", "feature"]],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": ["case", ["==", ["get", "active"], "true"], orange, blue],
    },
  },
  // Vertex
  //   Visible when editing polygons and lines
  //   Similar behaviour to Points
  //   Active state defines size
  {
    id: "gl-draw-vertex-outer",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["==", "meta", "vertex"],
      ["!=", "mode", "simple_select"],
    ],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 7, 5],
      "circle-color": white,
    },
  },
  {
    id: "gl-draw-vertex-inner",
    type: "circle",
    filter: [
      "all",
      ["==", "$type", "Point"],
      ["==", "meta", "vertex"],
      ["!=", "mode", "simple_select"],
    ],
    paint: {
      "circle-radius": ["case", ["==", ["get", "active"], "true"], 5, 3],
      "circle-color": orange,
    },
  },
  // Midpoint
  //   Visible when editing polygons and lines
  //   Tapping or dragging them adds a new vertex to the feature
  {
    id: "gl-draw-midpoint",
    type: "circle",
    filter: ["all", ["==", "meta", "midpoint"]],
    paint: {
      "circle-radius": 3,
      "circle-color": orange,
    },
  },
];
