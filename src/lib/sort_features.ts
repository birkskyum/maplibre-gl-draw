import * as area from "@birkskyum/geojson-area";
import * as Constants from "../constants.ts";
import type { Feature, Polygon, GeoJsonProperties } from "geojson";

const FEATURE_SORT_RANKS = {
  Point: 0,
  LineString: 1,
  MultiLineString: 1,
  Polygon: 2,
};

function comparator(a, b) {
  const score = FEATURE_SORT_RANKS[a.geometry.type] -
    FEATURE_SORT_RANKS[b.geometry.type];

  if (score === 0 && a.geometry.type === Constants.geojsonTypes.POLYGON) {
    return a.area - b.area;
  }

  return score;
}

// Sort in the order above, then sort polygons by area ascending.
export function sortFeatures(features: Feature[]): Feature[] {
  return features
    .map((feature) => {
      if (feature.geometry.type === Constants.geojsonTypes.POLYGON) {
        (feature as unknown as {area : number}).area = area.geometry({
          type: Constants.geojsonTypes.POLYGON as "Polygon",
          coordinates: (feature as Feature<Polygon, GeoJsonProperties>).geometry.coordinates,
        });
      }
      return feature;
    })
    .sort(comparator)
    .map((feature) => {
      delete (feature as unknown as {area?: number}).area;
      return feature;
    });
}
