import test from "node:test";
import assert from "node:assert/strict";
import { MapLibreDraw } from "../src/index.ts";
import { mouseClick } from "./utils/mouse_click.ts";
import { touchTap } from "./utils/touch_tap.ts";
import { createMap } from "./utils/create_map.ts";
import { makeMouseEvent } from "./utils/make_mouse_event.ts";
import { makeTouchEvent } from "./utils/make_touch_event.ts";
import { DrawPoint } from "../src/modes/draw_point.ts";
import { PointFeat } from "../src/feature_types/point.ts";
import { createMockDrawModeContext } from "./utils/create_mock_draw_mode_context.ts";
import { createMockLifecycleContext } from "./utils/create_mock_lifecycle_context.ts";
import { enterEvent, escapeEvent } from "./utils/key_events.ts";
import { objectToMode } from "../src/modes/object_to_mode.ts";
const drawPointMode = objectToMode(DrawPoint);

test("draw_point mode initialization", () => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const modeHandler = drawPointMode(context);
  modeHandler.start.call(lifecycleContext);

  assert.equal(context.store.add.callCount, 1, "store.add called");

  const emptypoint = new PointFeat(context, {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Point",
      coordinates: [],
    },
  });
  // Strip ids for this comparison
  assert.deepEqual(
    Object.assign({}, context.store.add.getCall(0).args[0], { id: null }),
    Object.assign({}, emptypoint, { id: null }),
    "with a new line",
  );
});

test("draw_point start", () => {
  const context = createMockDrawModeContext();
  const lifecycleContext = createMockLifecycleContext();
  const modeHandler = drawPointMode(context);
  modeHandler.start.call(lifecycleContext);

  assert.equal(
    context.store.clearSelected.callCount,
    1,
    "store.clearSelected called",
  );
  assert.equal(
    context.ui.queueMapClasses.callCount,
    1,
    "ui.queueMapClasses called",
  );
  assert.deepEqual(
    context.ui.queueMapClasses.getCall(0).args,
    [{ mouse: "add" }],
    "ui.queueMapClasses received correct arguments",
  );
  assert.equal(
    context.ui.setActiveButton.callCount,
    1,
    "ui.setActiveButton called",
  );
  assert.deepEqual(
    context.ui.setActiveButton.getCall(0).args,
    ["point"],
    "ui.setActiveButton received correct arguments",
  );

  assert.equal(lifecycleContext.on.callCount, 12, "this.on called");
});

test("draw_point stop with point placed", () => {
  const context = createMockDrawModeContext();
  const modeHandler = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  modeHandler.start.call(lifecycleContext);

  // Fake a placed point
  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);
  point.updateCoordinate(10, 20);

  modeHandler.stop.call(lifecycleContext);
  assert.equal(
    context.ui.setActiveButton.callCount,
    2,
    "ui.setActiveButton called",
  );
  assert.deepEqual(
    context.ui.setActiveButton.getCall(1).args,
    [undefined],
    "ui.setActiveButton received correct arguments",
  );
  assert.equal(context.store.delete.callCount, 0, "store.delete not called");
});

test("draw_point stop with no point placed", () => {
  const context = createMockDrawModeContext();
  const modeHandler = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  modeHandler.start.call(lifecycleContext);

  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);

  modeHandler.stop.call(lifecycleContext);

  assert.equal(
    context.ui.setActiveButton.callCount,
    2,
    "ui.setActiveButton called",
  );
  assert.deepEqual(
    context.ui.setActiveButton.getCall(1).args,
    [undefined],
    "ui.setActiveButton received correct arguments",
  );
  assert.equal(context.store.delete.callCount, 1, "store.delete called");
  assert.deepEqual(
    context.store.delete.getCall(0).args,
    [[point.id], { silent: true }],
    "store.delete received correct arguments",
  );
});

test("draw_point render the active point", () => {
  const context = createMockDrawModeContext();
  const modeHandler = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  modeHandler.start.call(lifecycleContext);

  const id = context.store.getAllIds()[0];
  const point = context.store.get(id);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      id: point.id,
    },
    geometry: {
      type: "Point",
      coordinates: [10, 10],
    },
  };
  modeHandler.render(geojson, (x) => memo.push(x));
  assert.equal(memo.length, 0, "active point does not render");
});

test("draw_point render an inactive feature", () => {
  const context = createMockDrawModeContext();
  const modeHandler = drawPointMode(context);
  const lifecycleContext = createMockLifecycleContext();
  modeHandler.start.call(lifecycleContext);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      meta: "nothing",
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [10, 10],
        [20, 20],
      ],
    },
  };
  modeHandler.render(geojson, (x) => memo.push(x));
  assert.equal(memo.length, 1, "does render");
  assert.deepEqual(
    memo[0],
    {
      type: "Feature",
      properties: {
        active: "false",
        meta: "nothing",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [10, 10],
          [20, 20],
        ],
      },
    },
    "unaltered except active: false",
  );
});

test("draw_point mouse interaction", async (t) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapLibreDraw();
  map.addControl(Draw);

  await map.on("load");

  // The following sub-tests share state ...

  t.test("clicking", () => {
    Draw.deleteAll();
    Draw.changeMode("draw_point");
    mouseClick(map, makeMouseEvent(10, 20));

    const { features } = Draw.getAll();
    assert.equal(features.length, 1, "point created");
    const point = Draw.getAll().features[0];
    assert.equal(point.geometry.type, "Point");

    assert.deepEqual(point.geometry.coordinates, [10, 20], "coordinate added");

    mouseClick(map, makeMouseEvent(30, 30));
    assert.equal(
      features.length,
      1,
      "mode has changed, so another click does not create another point",
    );
  });

  await t.test("exist before clicking by hitting Escape", () => {
    Draw.deleteAll();
    Draw.changeMode("draw_point");

    container.dispatchEvent(escapeEvent);

    assert.equal(Draw.getAll().features.length, 0, "no feature added");
    mouseClick(map, makeMouseEvent(30, 30));
    assert.equal(
      Draw.getAll().features.length,
      0,
      "mode has changed, so a click does not create another point",
    );
  });

  await t.test("exist before clicking by hitting Enter", () => {
    Draw.deleteAll();
    Draw.changeMode("draw_point");

    container.dispatchEvent(enterEvent);

    assert.equal(Draw.getAll().features.length, 0, "no feature added");
    mouseClick(map, makeMouseEvent(30, 30));
    assert.equal(
      Draw.getAll().features.length,
      0,
      "mode has changed, so a click does not create another point",
    );
  });

  t.test("exist before clicking with Trash", () => {
    Draw.deleteAll();
    Draw.changeMode("draw_point");

    Draw.trash();

    assert.equal(Draw.getAll().features.length, 0, "no feature added");
    mouseClick(map, makeMouseEvent(30, 30));
    assert.equal(
      Draw.getAll().features.length,
      0,
      "mode has changed, so a click does not create another point",
    );
  });

  document.body.removeChild(container);
});

test("draw_point touch interaction", async (t) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapLibreDraw();
  map.addControl(Draw);

  await map.on("load");
  // The following sub-tests share state ...

  t.test("tapping", () => {
    Draw.deleteAll();
    Draw.changeMode("draw_point");
    touchTap(map, makeTouchEvent(10, 20));

    const { features } = Draw.getAll();
    assert.equal(features.length, 1, "point created");
    const point = Draw.getAll().features[0];
    assert.equal(point.geometry.type, "Point");

    assert.deepEqual(point.geometry.coordinates, [10, 20], "coordinate added");

    touchTap(map, makeTouchEvent(30, 30));
    assert.equal(
      features.length,
      1,
      "mode has changed, so another click does not create another point",
    );
  });

  document.body.removeChild(container);
});
