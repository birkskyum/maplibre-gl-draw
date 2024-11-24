/* eslint no-shadow:[0] */
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

import { MapLibreDraw} from "../src/index.ts";
import { ModeClasses } from "../src/modes.ts";
import { ModeStrings } from "../src/constants/modes.ts";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const styleWithSourcesFixture = JSON.parse(
  fs.readFileSync(path.join(__dirname, "./fixtures/style_with_sources.json")),
);

test("Options test", async (t) => {
  t.test("no options", () => {
    const Draw = new MapLibreDraw();
    const defaultOptions = {
      defaultMode: "simple_select",
      modes: ModeClasses,
      touchEnabled: true,
      keybindings: true,
      clickBuffer: 2,
      touchBuffer: 25,
      displayControlsDefault: true,
      boxSelect: true,
      userProperties: false,
      styles: Draw.ctx.options.styles,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true,
      },
    };
    assert.deepEqual(defaultOptions, Draw.ctx.options);
    assert.deepEqual(styleWithSourcesFixture, Draw.ctx.options.styles);
  });

  await t.test("use custom clickBuffer", () => {
    const Draw = new MapLibreDraw({ clickBuffer: 10 });
    const defaultOptions = {
      defaultMode: ModeStrings.SIMPLE_SELECT,
      modes: ModeClasses,
      keybindings: true,
      touchEnabled: true,
      clickBuffer: 10,
      touchBuffer: 25,
      boxSelect: true,
      displayControlsDefault: true,
      styles: Draw.ctx.options.styles,
      userProperties: false,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true,
      },
    };

    assert.deepEqual(defaultOptions, Draw.ctx.options);
  });

  t.test("hide all controls", () => {
    const Draw = new MapLibreDraw({ displayControlsDefault: false });
    const defaultOptions = {
      defaultMode: "simple_select",
      modes: ModeClasses,
      keybindings: true,
      touchEnabled: true,
      clickBuffer: 2,
      touchBuffer: 25,
      boxSelect: true,
      displayControlsDefault: false,
      userProperties: false,
      styles: Draw.ctx.options.styles,
      controls: {
        point: false,
        line_string: false,
        polygon: false,
        trash: false,
        combine_features: false,
        uncombine_features: false,
      },
    };
    assert.deepEqual(defaultOptions, Draw.ctx.options);
  });

  await t.test("hide controls but show point", () => {
    const Draw = new MapLibreDraw({
      displayControlsDefault: false,
      controls: { point: true },
    });
    const defaultOptions = {
      defaultMode: "simple_select",
      modes: ModeClasses,
      keybindings: true,
      touchEnabled: true,
      displayControlsDefault: false,
      clickBuffer: 2,
      touchBuffer: 25,
      boxSelect: true,
      userProperties: false,
      styles: Draw.ctx.options.styles,
      controls: {
        point: true,
        line_string: false,
        polygon: false,
        trash: false,
        combine_features: false,
        uncombine_features: false,
      },
    };

    assert.deepEqual(defaultOptions, Draw.ctx.options);
  });

  t.test("hide only point control", () => {
    const Draw = new MapLibreDraw({ controls: { point: false } });
    const defaultOptions = {
      defaultMode: "simple_select",
      modes: ModeClasses,
      keybindings: true,
      touchEnabled: true,
      displayControlsDefault: true,
      touchBuffer: 25,
      clickBuffer: 2,
      userProperties: false,
      boxSelect: true,
      styles: Draw.ctx.options.styles,
      controls: {
        point: false,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true,
      },
    };

    assert.deepEqual(defaultOptions, Draw.ctx.options);
  });

  await t.test("disable touch interaction", () => {
    const Draw = new MapLibreDraw({ touchEnabled: false });
    const defaultOptions = {
      defaultMode: "simple_select",
      modes: ModeClasses,
      touchEnabled: false,
      keybindings: true,
      clickBuffer: 2,
      touchBuffer: 25,
      displayControlsDefault: true,
      userProperties: false,
      boxSelect: true,
      styles: Draw.ctx.options.styles,
      controls: {
        point: true,
        line_string: true,
        polygon: true,
        trash: true,
        combine_features: true,
        uncombine_features: true,
      },
    };
    assert.deepEqual(defaultOptions, Draw.ctx.options);
    assert.deepEqual(styleWithSourcesFixture, Draw.ctx.options.styles);
  });

  await t.test("custom styles", () => {
    const Draw = new MapLibreDraw({
      styles: [
        {
          id: "custom-polygon",
          type: "fill",
          filter: ["all", ["==", "$type", "Polygon"]],
          paint: {
            "fill-color": "#fff",
          },
        },
        {
          id: "custom-point",
          type: "circle",
          filter: ["all", ["==", "$type", "Point"]],
          paint: {
            "circle-color": "#fff",
          },
        },
      ],
    });

    const styles = [
      {
        id: "custom-polygon.cold",
        source: "maplibre-gl-draw-cold",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"]],
        paint: {
          "fill-color": "#fff",
        },
      },
      {
        id: "custom-point.cold",
        source: "maplibre-gl-draw-cold",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"]],
        paint: {
          "circle-color": "#fff",
        },
      },
      {
        id: "custom-polygon.hot",
        source: "maplibre-gl-draw-hot",
        type: "fill",
        filter: ["all", ["==", "$type", "Polygon"]],
        paint: {
          "fill-color": "#fff",
        },
      },
      {
        id: "custom-point.hot",
        source: "maplibre-gl-draw-hot",
        type: "circle",
        filter: ["all", ["==", "$type", "Point"]],
        paint: {
          "circle-color": "#fff",
        },
      },
    ];

    assert.deepEqual(styles, Draw.ctx.options.styles);
  });
});
