import { test } from "vitest";
import {assert, assertEquals, assertNotEquals, assertThrows} from "@std/assert";
import { sortFeatures } from "./sort_features.ts";

test("sortFeatures", () => {
  const features = [
    {
      geometry: { type: "LineString" },
      properties: { id: 1 },
    },
    {
      id: "medium-polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15, 50],
            [15, 59],
            [35, 59],
            [35, 50],
            [15, 50],
          ],
        ],
      },
    },
    {
      geometry: { type: "Point" },
      properties: { id: 3 },
    },
    {
      id: "huge-polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [58, 27],
            [58, 68],
            [101, 68],
            [101, 27],
            [58, 27],
          ],
        ],
      },
    },
    {
      geometry: { type: "Point" },
      properties: { id: 1 },
    },
    {
      geometry: { type: "LineString" },
      properties: { id: "foo" },
    },
    {
      geometry: { type: "LineString" },
      properties: { id: "bar" },
    },
  ];

  assertEquals(sortFeatures(features), [
    {
      geometry: { type: "Point" },
      properties: { id: 3 },
    },
    {
      geometry: { type: "Point" },
      properties: { id: 1 },
    },
    {
      geometry: { type: "LineString" },
      properties: { id: 1 },
    },
    {
      geometry: { type: "LineString" },
      properties: { id: "foo" },
    },
    {
      geometry: { type: "LineString" },
      properties: { id: "bar" },
    },
    {
      id: "medium-polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [15, 50],
            [15, 59],
            [35, 59],
            [35, 50],
            [15, 50],
          ],
        ],
      },
    },
    {
      id: "huge-polygon",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [58, 27],
            [58, 68],
            [101, 68],
            [101, 27],
            [58, 27],
          ],
        ],
      },
    },
  ]);
});
