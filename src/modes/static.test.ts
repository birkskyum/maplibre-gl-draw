/* eslint no-shadow:[0] */
import { test, describe } from "vitest";
import {assert, assertEquals, assertNotEquals, assertThrows} from "@std/assert";
import { spy } from "sinon";

import { MapLibreDraw } from "../index.ts";
import { setupAfterNextRender } from "../../test/utils/after_next_render.ts";
import { makeMouseEvent } from "../../test/utils/make_mouse_event.ts";
import { getGeoJSON } from "../../test/utils/get_geojson.ts";
import { createMap } from "../../test/utils/create_map.ts";
import { StaticMode } from "../modes/static_mode.ts";

describe("static", async (t) => {
  const map = createMap();
  const opts = {
    modes: {
      static: StaticMode,
    },
    defaultMode: "static",
  };
  const Draw = new MapLibreDraw(opts);
  map.addControl(Draw);

  spy(map, "fire");
  map.dragPan.disable();
  spy(map.dragPan, "disable");

  const afterNextRender = setupAfterNextRender(map);

  const cleanUp = function () {
    Draw.deleteAll();
    map.fire.resetHistory();
  };

  const getFireArgs = function () {
    const args: any[] = [];
    for (let i = 0; i < map.fire.callCount; i++) {
      args.push(map.fire.getCall(i).args);
    }
    return args;
  };

  test("static - init map for tests", () => {
    const done = function () {
      map.off("load", done);
    };

    if (map.loaded()) {
      done();
    } else {
      map.on("load", done);
    }
  });

  await test("static - box select", async () => {
    Draw.add(getGeoJSON("negativePoint"));
    Draw.add(getGeoJSON("point"));
    map.fire.resetHistory();

    await afterNextRender();
    map.dragPan.disable.resetHistory();
    map.fire("mousedown", makeMouseEvent(0, 0, { shiftKey: true }));
    assertEquals(map.dragPan.disable.callCount, 0, "dragPan is still enabled");
    map.fire("mousemove", makeMouseEvent(15, 15, { shiftKey: true }));
    map.fire("mouseup", makeMouseEvent(15, 15, { shiftKey: true }));

    const args = getFireArgs().filter(
      (arg) => arg[0] === "draw.selectionchange",
    );
    assertEquals(args.length, 0, "should have zero selectionchange events");
    cleanUp();
  });

  await test("static - try clicking many features", async () => {
    const features = [
      getGeoJSON("point"),
      getGeoJSON("line"),
      getGeoJSON("square"),
    ];
    Draw.add({
      type: "FeatureCollection",
      features,
    });
    map.fire.resetHistory();

    await afterNextRender();
    map.fire("mousedown", makeMouseEvent(10, 10));
    map.fire("mouseup", makeMouseEvent(10, 10));
    map.fire("mousemove", makeMouseEvent(1.5, 1.5));
    map.fire("mouseup", makeMouseEvent(1.5, 1.5));
    map.fire("mousemove", makeMouseEvent(1, 1));
    map.fire("mouseup", makeMouseEvent(1, 1));

    const args = getFireArgs().filter(
      (arg) => arg[0] === "draw.selectionchange",
    );
    assertEquals(args.length, 0, "should have zero selectionchange events");
    cleanUp();
  });
});
