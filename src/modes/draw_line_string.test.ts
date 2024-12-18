import {test, describe} from "vitest";
import {assert, assertEquals, assertNotEquals, assertThrows} from "@std/assert";
import { MapLibreDraw } from "../index.ts";
import { mouseClick } from "../../test/utils/mouse_click.ts";
import { touchTap } from "../../test/utils/touch_tap.ts";
import { createMap } from "../../test/utils/create_map.ts";
import { makeMouseEvent } from "../../test/utils/make_mouse_event.ts";
import { makeTouchEvent } from "../../test/utils/make_touch_event.ts";
import { DrawLineString } from "./draw_line_string.ts";
import { LineStringFeat } from "../feature_types/line_string.ts";
import { createMockDrawModeContext } from "../../test/utils/create_mock_draw_mode_context.ts";
import { createMockLifecycleContext } from "../../test/utils/create_mock_lifecycle_context.ts";
import { objectToMode } from "./object_to_mode.ts";
import { setupAfterNextRender } from "../../test/utils/after_next_render.ts";

const drawLineStringMode = objectToMode(DrawLineString);

import {
  enterEvent,
  escapeEvent,
  startLineStringEvent,
  startPointEvent,
  startPolygonEvent,
} from "../../test/utils/key_events.ts";

test("draw_line_string mode initialization", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  assertEquals(context.store.add.callCount, 1, "store.add called");

  const emptyLine = new LineStringFeat(context, {
    type: "Feature",
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: [],
    },
  });
  // Strip ids for this comparison
  assertEquals(
    Object.assign({}, context.store.add.getCall(0).args[0], { id: null }),
    Object.assign({}, emptyLine, { id: null }),
    "with a new line",
  );
});

test("draw_line_string start", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  assertEquals(
    context.store.clearSelected.callCount,
    1,
    "store.clearSelected called",
  );
  assertEquals(
    context.ui.queueMapClasses.callCount,
    1,
    "ui.queueMapClasses called",
  );
  assertEquals(
    context.ui.queueMapClasses.getCall(0).args,
    [{ mouse: "add" }],
    "ui.queueMapClasses received correct arguments",
  );
  assertEquals(
    context.ui.setActiveButton.callCount,
    1,
    "ui.setActiveButton called",
  );
  assertEquals(
    context.ui.setActiveButton.getCall(0).args,
    ["line_string"],
    "ui.setActiveButton received correct arguments",
  );

  setTimeout(() => {
    assertEquals(context.map.doubleClickZoom.disable.callCount, 1);
  }, 10);
});

test("draw_line_string stop with valid line", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake a valid line
  const line = context.store.get(context.store.getAllIds()[0]);
  line.isValid = () => true;

  mode.stop.call();
  assertEquals(
    context.ui.setActiveButton.callCount,
    2,
    "ui.setActiveButton called",
  );
  assertEquals(
    context.ui.setActiveButton.getCall(1).args,
    [undefined],
    "ui.setActiveButton received correct arguments",
  );
  assertEquals(context.store.delete.callCount, 0, "store.delete not called");
});

test("draw_line_string stop with invalid line", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  // Fake an invalid line
  const line = context.store.get(context.store.getAllIds()[0]);
  line.isValid = () => false;

  mode.stop.call();
  assertEquals(
    context.ui.setActiveButton.callCount,
    2,
    "ui.setActiveButton called",
  );
  assertEquals(
    context.ui.setActiveButton.getCall(1).args,
    [undefined],
    "ui.setActiveButton received correct arguments",
  );
  assertEquals(context.store.delete.callCount, 1, "store.delete called");
  if (context.store.delete.callCount > 0) {
    assertEquals(
      context.store.delete.getCall(0).args,
      [[line.id], { silent: true }],
      "store.delete received correct arguments",
    );
  }
});

test("draw_line_string render active line with 0 coordinates", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      id: line.id,
    },
    geometry: {
      type: "LineString",
      coordinates: [],
    },
  };
  mode.render(geojson, (x) => memo.push(x));
  assertEquals(memo.length, 0, "does not render");
});

test("draw_line_string render active line with 1 coordinate", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      id: line.id,
    },
    geometry: {
      type: "LineString",
      coordinates: [[0, 0]],
    },
  };
  mode.render(geojson, (x) => memo.push(x));
  assertEquals(memo.length, 0, "does not render");
});

test("draw_line_string render active line with 2 coordinates", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const line = context.store.get(context.store.getAllIds()[0]);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      id: line.id,
    },
    geometry: {
      type: "LineString",
      coordinates: [
        [0, 0],
        [10, 10],
      ],
    },
  };
  mode.render(geojson, (x) => memo.push(x));
  assertEquals(memo.length, 2, "does render");
  assertEquals(
    memo[1],
    {
      type: "Feature",
      properties: {
        id: line.id,
        active: "true",
        meta: "feature",
      },
      geometry: {
        type: "LineString",
        coordinates: [
          [0, 0],
          [10, 10],
        ],
      },
    },
    "with active: true, meta: feature",
  );
});

test("draw_line_string render inactive feature", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const memo: any[] = [];
  const geojson = {
    type: "Feature",
    properties: {
      meta: "nothing",
    },
    geometry: {
      type: "Point",
      coordinates: [0, 0],
    },
  };
  mode.render(geojson, (x) => memo.push(x));
  assertEquals(memo.length, 1, "does render");
  assertEquals(
    memo[0],
    {
      type: "Feature",
      properties: {
        active: "false",
        meta: "nothing",
      },
      geometry: {
        type: "Point",
        coordinates: [0, 0],
      },
    },
    "unaltered except active: false",
  );
});

describe("draw_line_string mouse interaction", async (t) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapLibreDraw();
  map.addControl(Draw);
  const afterNextRender = setupAfterNextRender(map);

  await map.on("load");

  // The following sub-tests share state ...

  Draw.changeMode("draw_line_string");
  test("first click", () => {
    mouseClick(map, makeMouseEvent(10, 20));

    const { features } = Draw.getAll();
    assertEquals(features.length, 1, "line created");
    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.type, "LineString");

    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [10, 20],
      ],
      "starting coordinate added",
    );
  });

  test("move mouse", () => {
    map.fire("mousemove", makeMouseEvent(15, 23));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [15, 23],
      ],
      "last coordinate added",
    );
  });

  test("move mouse again", () => {
    map.fire("mousemove", makeMouseEvent(30, 33));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [30, 33],
      ],
      "last coordinate replaced",
    );
  });

  test("click to add another vertex", () => {
    mouseClick(map, makeMouseEvent(35, 35));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [35, 35],
        [35, 35],
      ],
      "last coordinate replaced",
    );
  });

  test("add more points then click on the last vertex to finish", () => {
    mouseClick(map, makeMouseEvent(40, 40));
    mouseClick(map, makeMouseEvent(50, 50));
    mouseClick(map, makeMouseEvent(55, 55));
    mouseClick(map, makeMouseEvent(55, 55));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [35, 35],
        [40, 40],
        [50, 50],
        [55, 55],
      ],
      "all coordinates in place",
    );

    mouseClick(map, makeMouseEvent(40, 40));
    assertEquals(
      line.geometry.coordinates,
      [
        [10, 20],
        [35, 35],
        [40, 40],
        [50, 50],
        [55, 55],
      ],
      "since we exited draw_line_string mode, another click does not add a coordinate",
    );
  });

  await test("start a line but trash it before completion", () => {
    // Start a new line
    Draw.deleteAll();
    Draw.changeMode("draw_line_string");
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.coordinates, [
      [1, 1],
      [2, 2],
      [3, 3],
      [3, 3],
    ]);

    Draw.trash();
    assertEquals(Draw.getAll().features.length, 0, "no feature added");

    mouseClick(map, makeMouseEvent(1, 1));
    assertEquals(Draw.getAll().features.length, 0, "no longer drawing");
  });

  test("start a line but trash it with Escape before completion", () => {
    // Start a new line
    Draw.deleteAll();
    Draw.changeMode("draw_line_string");
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.coordinates, [
      [1, 1],
      [2, 2],
      [3, 3],
      [3, 3],
    ]);

    container.dispatchEvent(escapeEvent);

    assertEquals(Draw.getAll().features.length, 0, "no feature added");

    mouseClick(map, makeMouseEvent(1, 1));
    map.fire("mousemove", makeMouseEvent(16, 16));
    assertEquals(Draw.getAll().features.length, 0, "no longer drawing");
  });

  // ZERO CLICK TESTS

  test("start a line and end it with Enter", () => {
    // Start a new line
    Draw.deleteAll();
    Draw.changeMode("draw_line_string");
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire("mousemove", makeMouseEvent(16, 16));
    mouseClick(map, makeMouseEvent(2, 2));
    mouseClick(map, makeMouseEvent(3, 3));

    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.coordinates, [
      [1, 1],
      [2, 2],
      [3, 3],
      [3, 3],
    ]);

    container.dispatchEvent(enterEvent);

    assertEquals(Draw.getAll().features.length, 1, "the feature was added");
    assertEquals(
      Draw.getAll().features[0].geometry.coordinates,
      [
        [1, 1],
        [2, 2],
        [3, 3],
      ],
      "the line is correct",
    );

    mouseClick(map, makeMouseEvent(1, 1));
    map.fire("mousemove", makeMouseEvent(16, 16));
    assertEquals(Draw.getAll().features.length, 1, "no longer drawing");
  });

  test("start draw_line_string mode then changemode before a click", () => {
    Draw.deleteAll();
    assertEquals(Draw.getAll().features.length, 0, "no features yet");

    Draw.changeMode("draw_line_string");
    assertEquals(Draw.getAll().features.length, 1, "line is added");
    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.coordinates, [], "and has no coordinates");

    Draw.changeMode("simple_select");
    assertEquals(Draw.getAll().features.length, 0, "line is removed");
  });

  // ONE CLICK TESTS

  test("start draw_line_string mode then enter after one click", () => {
    Draw.deleteAll();
    assertEquals(Draw.getAll().features.length, 0, "no features yet");

    Draw.changeMode("draw_line_string");
    assertEquals(Draw.getAll().features.length, 1, "line is added");
    mouseClick(map, makeMouseEvent(1, 1));
    map.fire("mousemove", makeMouseEvent(16, 16));

    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [1, 1],
        [16, 16],
      ],
      "and has right coordinates",
    );

    container.dispatchEvent(enterEvent);
    assertEquals(Draw.getAll().features.length, 0, "line_string was removed");
  });

  test(
    "start draw_line_string mode then start a point after one click",
    () => {
      Draw.deleteAll();
      assertEquals(Draw.getAll().features.length, 0, "no features yet");

      Draw.changeMode("draw_line_string");
      assertEquals(Draw.getAll().features.length, 1, "line is added");
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire("mousemove", makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      assertEquals(
        line.geometry.coordinates,
        [
          [1, 1],
          [16, 16],
        ],
        "and has right coordinates",
      );

      container.dispatchEvent(startPointEvent);
      assertEquals(Draw.get(line.id), undefined, "line_string was removed");
    },
  );

  test(
    "start draw_line_string mode then start a line_string after one click",
    () => {
      Draw.deleteAll();
      assertEquals(Draw.getAll().features.length, 0, "no features yet");

      Draw.changeMode("draw_line_string");
      assertEquals(Draw.getAll().features.length, 1, "line is added");
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire("mousemove", makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      assertEquals(
        line.geometry.coordinates,
        [
          [1, 1],
          [16, 16],
        ],
        "and has right coordinates",
      );

      container.dispatchEvent(startLineStringEvent);
      assertEquals(Draw.get(line.id), undefined, "line_string was removed");
    },
  );

  test(
    "start draw_line_string mode then start a polygon after one click",
    () => {
      Draw.deleteAll();
      assertEquals(Draw.getAll().features.length, 0, "no features yet");

      Draw.changeMode("draw_line_string");
      assertEquals(Draw.getAll().features.length, 1, "line is added");
      mouseClick(map, makeMouseEvent(1, 1));
      map.fire("mousemove", makeMouseEvent(16, 16));

      const line = Draw.getAll().features[0];
      assertEquals(
        line.geometry.coordinates,
        [
          [1, 1],
          [16, 16],
        ],
        "and has right coordinates",
      );

      container.dispatchEvent(startPolygonEvent);
      assertEquals(Draw.get(line.id), undefined, "line_string was removed");
    },
  );

  test("start draw_line_string mode then double click", () => {
    Draw.deleteAll();
    assertEquals(Draw.getAll().features.length, 0, "no features yet");

    Draw.changeMode("draw_line_string");
    assertEquals(Draw.getAll().features.length, 1, "line is added");
    mouseClick(map, makeMouseEvent(1, 1));
    mouseClick(map, makeMouseEvent(1, 1));

    assertEquals(Draw.getAll().features.length, 0, "line_string was removed");
  });

  // THREE CLICK TEST

  await test("start draw_line_string mode then double click", async () => {
    Draw.deleteAll();
    assertEquals(Draw.getAll().features.length, 0, "no features yet");

    Draw.changeMode("draw_line_string");
    let lineString = Draw.getAll().features[0];
    assertEquals(lineString !== undefined, true, "line is added");
    mouseClick(map, makeMouseEvent(0, 0));

    await afterNextRender();

    mouseClick(map, makeMouseEvent(15, 15));
    map.fire("mousemove", makeMouseEvent(30, 30));

    await afterNextRender();

    map.fire("mousemove", makeMouseEvent(15, 15));
    mouseClick(map, makeMouseEvent(16, 16));
    lineString = Draw.get(lineString.id);
    assertEquals(lineString !== undefined, true, "line_string is here");
    assertEquals(
      lineString,
      {
        id: lineString.id,
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [0, 0],
            [15, 15],
          ],
        },
      },
      "line_string has the right coordinates",
    );
  });

  document.body.removeChild(container);
});

describe("draw_line_string touch interaction", async (t) => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapLibreDraw();
  map.addControl(Draw);

  await map.on("load");

  // The following sub-tests share state ...

  Draw.changeMode("draw_line_string");
  test("first tap", () => {
    touchTap(map, makeTouchEvent(100, 200));

    const { features } = Draw.getAll();
    assertEquals(features.length, 1, "line created");
    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.type, "LineString");

    assertEquals(
      line.geometry.coordinates,
      [
        [100, 200],
        [100, 200],
      ],
      "starting coordinate added",
    );
  });

  await test("tap to add another vertex", () => {
    touchTap(map, makeTouchEvent(200, 400));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [100, 200],
        [200, 400],
        [200, 400],
      ],
      "last coordinate replaced",
    );
  });

  test("add more points then tap on the last vertex to finish", () => {
    touchTap(map, makeTouchEvent(400, 500));
    touchTap(map, makeTouchEvent(300, 500));
    touchTap(map, makeTouchEvent(200, 500));
    touchTap(map, makeTouchEvent(200, 500));
    const line = Draw.getAll().features[0];
    assertEquals(
      line.geometry.coordinates,
      [
        [100, 200],
        [200, 400],
        [400, 500],
        [300, 500],
        [200, 500],
      ],
      "all coordinates in place",
    );

    touchTap(map, makeTouchEvent(700, 700));
    assertEquals(
      line.geometry.coordinates,
      [
        [100, 200],
        [200, 400],
        [400, 500],
        [300, 500],
        [200, 500],
      ],
      "since we exited draw_line_string mode, another tap does not add a coordinate",
    );
  });

  await test("start a line but trash it before completion", () => {
    // Start a new line
    Draw.deleteAll();
    Draw.changeMode("draw_line_string");
    touchTap(map, makeTouchEvent(100, 100));
    touchTap(map, makeTouchEvent(200, 200));
    touchTap(map, makeTouchEvent(300, 300));

    const line = Draw.getAll().features[0];
    assertEquals(line.geometry.coordinates, [
      [100, 100],
      [200, 200],
      [300, 300],
      [300, 300],
    ]);

    Draw.trash();
    assertEquals(Draw.getAll().features.length, 0, "no feature added");

    touchTap(map, makeTouchEvent(100, 100));
    assertEquals(Draw.getAll().features.length, 0, "no longer drawing");
  });

  document.body.removeChild(container);
});

test("draw_line_string continue LineString", () => {
  const context = createMockDrawModeContext();
  const mode = drawLineStringMode(context);
  const lifecycleContext = createMockLifecycleContext();
  mode.start.call(lifecycleContext);

  const coordinates = [
    [0, 0],
    [5, 5],
    [10, 10],
  ];
  const geojson = {
    type: "Feature",
    id: 1,
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coordinates.slice(0),
    },
  };
  const line = new LineStringFeat(context, geojson);
  context.store.add(line);
  assertThrows(
    () => drawLineStringMode(context, { featureId: 2 }).start(lifecycleContext),
    /featureId/,
    "wrong feature id",
  );
  assertThrows(
    () => drawLineStringMode(context, { featureId: 1 }).start(lifecycleContext),
    /from.*property/,
    'no "from" prop',
  );
  assertThrows(
    () =>
      drawLineStringMode(context, { featureId: 1, from: "[0, 0]" }).start.call(
        lifecycleContext,
      ),
    /from.*property/,
    "incorrect from prop",
  );
  assertThrows(
    () =>
      drawLineStringMode(context, { featureId: 1, from: [-1, -1] }).start.call(
        lifecycleContext,
      ),
    /start or the end/,
    "not on line",
  );
  assertThrows(
    () =>
      drawLineStringMode(context, { featureId: 1, from: [5, 5] }).start.call(
        lifecycleContext,
      ),
    /start or the end/,
    "not at line endpoint",
  );
  drawLineStringMode(context, { featureId: 1, from: [0, 0] }).start.call(
    lifecycleContext,
  );

  let testLine = context.store.get(context.store.getAllIds()[0]);
  assertEquals(testLine.id, 1, "initialized with correct line");
  assertEquals(
    testLine.coordinates,
    [[0, 0], ...coordinates],
    "added one coordinate at the start endpoint",
  );

  drawLineStringMode(context, { featureId: 1, from: [10, 10] }).start.call(
    lifecycleContext,
  );
  testLine = context.store.get(context.store.getAllIds()[0]);
  assertEquals(
    testLine.coordinates,
    [[0, 0], ...coordinates, [10, 10]],
    "added one coordinate at the end endpoint",
  );

  try {
      drawLineStringMode(context, {
        featureId: 1,
        from: { type: "Point", coordinates: [0, 0] },
      }).start.call(lifecycleContext);
  } catch (e) {
    throw "initializes with Point";
  }
  

  try {
      drawLineStringMode(context, {
        featureId: 1,
        from: {
          type: "Feature",
          geometry: { type: "Point", coordinates: [0, 0] },
          properties: {},
        },
      }).start.call(lifecycleContext);
    } catch (e) {
      throw "initializes with a Feature<Point>"
  }
  });

test("draw_line_string continue LineString mouseClick", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const map = createMap({ container });
  const Draw = new MapLibreDraw();
  map.addControl(Draw);
  const afterNextRender = setupAfterNextRender(map);

  await map.on("load");

  const coordinates = [
    [0, 0],
    [5, 5],
    [10, 10],
  ];
  const geojson = {
    type: "Feature",
    id: 1,
    properties: {},
    geometry: {
      type: "LineString",
      coordinates: coordinates.slice(0),
    },
  };
  Draw.add(geojson);

  Draw.changeMode("draw_line_string", { featureId: 1, from: [0, 0] });
  mouseClick(map, makeMouseEvent(-1, -1));

  await afterNextRender();

  const line = Draw.getAll().features[0];
  assertEquals(
    line.geometry.coordinates,
    [[-1, -1], [-1, -1], ...coordinates],
    "line continues from the start",
  );
  Draw.changeMode("draw_line_string", { featureId: 1, from: [10, 10] });
  mouseClick(map, makeMouseEvent(12, 12));

  await afterNextRender();

  const line2 = Draw.getAll().features[0];
  assertEquals(
    line2.geometry.coordinates,
    [[-1, -1], ...coordinates, [12, 12], [12, 12]],
    "line continues from the end",
  );

  document.body.removeChild(container);
});
