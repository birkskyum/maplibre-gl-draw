import test from "node:test";
import assert from "node:assert/strict";
import { spy } from "sinon";
import { Feat } from "../src/feature_types/feature.ts";
import { LineStringFeat } from "../src/feature_types/line_string.ts";
import { MapLibreDraw } from "../src/index.ts";
import { createFeature } from "./utils/create_feature.ts";
import { getPublicMemberKeys } from "./utils/get_public_member_keys.ts";
import { createMockFeatureContext } from "./utils/create_mock_feature_context.ts";
import { drawGeometry } from "./utils/draw_geometry.ts";
import { createMap } from "./utils/create_map.ts";

test("LineString constructor and API", () => {
  const rawLine = createFeature("line");
  const ctx = createMockFeatureContext();
  const lineString = new LineStringFeat(ctx, rawLine);

  // Instance members
  assert.equal(lineString.ctx, ctx, "lineString.ctx");
  assert.equal(
    lineString.coordinates,
    rawLine.geometry.coordinates,
    "lineString.coordinates",
  );
  assert.equal(
    lineString.properties,
    rawLine.properties,
    "lineString.properties",
  );
  assert.equal(lineString.id, rawLine.id, "lineString.id");
  assert.equal(lineString.type, rawLine.geometry.type, "lineString.type");
  assert.equal(
    getPublicMemberKeys(lineString).length,
    5,
    "no unexpected instance members",
  );

  // Prototype members
  assert.equal(
    typeof LineStringFeat.prototype.isValid,
    "function",
    "lineString.isValid",
  );
  assert.equal(
    typeof LineStringFeat.prototype.addCoordinate,
    "function",
    "lineString.addCoordinate",
  );
  assert.equal(
    typeof LineStringFeat.prototype.getCoordinate,
    "function",
    "lineString.getCoordinate",
  );
  assert.equal(
    typeof LineStringFeat.prototype.removeCoordinate,
    "function",
    "lineString.removeCoordinate",
  );
  assert.equal(
    typeof LineStringFeat.prototype.updateCoordinate,
    "function",
    "lineString.updateCoordinate",
  );
  assert.equal(
    Object.getOwnPropertyNames(LineStringFeat.prototype).length,
    6,
    "no unexpected prototype members",
  );

  assert.ok(
    LineStringFeat.prototype instanceof Feat,
    "inherits from Feature",
  );
});

test("LineString#isValid", () => {
  const validRawLine = createFeature("line");
  const validLineString = new LineStringFeat(
    createMockFeatureContext(),
    validRawLine,
  );
  assert.equal(validLineString.isValid(), true, "returns true when valid");

  const invalidRawLineA = createFeature("line");
  invalidRawLineA.geometry.coordinates = [3];
  const invalidLineStringA = new LineStringFeat(
    createMockFeatureContext(),
    invalidRawLineA,
  );
  assert.equal(
    invalidLineStringA.isValid(),
    false,
    "returns false when there is one coordinate",
  );

  const invalidRawLineB = createFeature("line");
  invalidRawLineB.geometry.coordinates = [];
  const invalidLineStringB = new LineStringFeat(
    createMockFeatureContext(),
    invalidRawLineB,
  );
  assert.equal(
    invalidLineStringB.isValid(),
    false,
    "returns false when there are no coordinates",
  );
});

test("LineString#addCoordinate", () => {
  const rawLine = createFeature("line");
  rawLine.geometry.coordinates = [
    [1, 2],
    [3, 4],
  ];
  const lineString = new LineStringFeat(createMockFeatureContext(), rawLine);
  const changedSpy = spy(lineString, "changed");

  lineString.addCoordinate(1, 5, 6);
  assert.equal(changedSpy.callCount, 1, "called lineString.changed()");
  assert.deepEqual(
    lineString.getCoordinates(),
    [
      [1, 2],
      [5, 6],
      [3, 4],
    ],
    "new coordinate inserted in correct place",
  );

  lineString.addCoordinate("0", 7, 8);
  assert.deepEqual(
    lineString.getCoordinates(),
    [
      [7, 8],
      [1, 2],
      [5, 6],
      [3, 4],
    ],
    "string path works",
  );
});

test("LineString#getCoordinate", () => {
  const rawLine = createFeature("line");
  rawLine.geometry.coordinates = [
    [1, 2],
    [3, 4],
  ];
  const lineString = new LineStringFeat(createMockFeatureContext(), rawLine);

  assert.deepEqual(lineString.getCoordinate(0), [1, 2], "number path works");
  assert.deepEqual(lineString.getCoordinate("1"), [3, 4], "string path works");
});

test("LineString#removeCoordinate", () => {
  const rawLine = createFeature("line");
  rawLine.geometry.coordinates = [
    [1, 2],
    [3, 4],
  ];
  const lineString = new LineStringFeat(createMockFeatureContext(), rawLine);
  const changedSpy = spy(lineString, "changed");

  lineString.removeCoordinate(1);
  assert.equal(changedSpy.callCount, 1, "called lineString.changed()");
  assert.deepEqual(
    lineString.getCoordinates(),
    [[1, 2]],
    "coordinate removed from correct place",
  );
});

test("LineString#updateCoordinate", () => {
  const rawLine = createFeature("line");
  rawLine.geometry.coordinates = [
    [1, 2],
    [3, 4],
    [5, 6],
  ];
  const lineString = new LineStringFeat(createMockFeatureContext(), rawLine);
  const changedSpy = spy(lineString, "changed");

  lineString.updateCoordinate(1, 7, 8);
  assert.equal(changedSpy.callCount, 1, "called lineString.changed()");
  assert.deepEqual(
    lineString.getCoordinates(),
    [
      [1, 2],
      [7, 8],
      [5, 6],
    ],
    "coordinate updated at correct place",
  );
});

test("LineString integration", async () => {
  const lineStringCoordinates = [
    [0, 0],
    [40, 20],
    [20, 40],
  ];
  const map = createMap();
  const Draw = new MapLibreDraw();
  map.addControl(Draw);

  await map.on("load");

  drawGeometry(map, Draw, "LineString", lineStringCoordinates, () => {
    const feats = Draw.getAll().features;
    assert.equal(1, feats.length, "only one");
    assert.equal("LineString", feats[0].geometry.type, "of the right type");
    assert.equal(
      lineStringCoordinates[0].length,
      feats[0].geometry.coordinates[0].length,
      "right number of points",
    );
    assert.deepEqual(
      [...lineStringCoordinates, [20, 40]],
      feats[0].geometry.coordinates,
      "in the right spot",
    );
    Draw.onRemove();
  });
});
