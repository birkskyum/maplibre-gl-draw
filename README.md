# @birkskyum/maplibre-gl-draw

[![JSR](https://jsr.io/badges/@birkskyum/maplibre-gl-draw)](https://jsr.io/@birkskyum/maplibre-gl-draw)

Adds support for drawing and editing features on
[maplibre-gl.js](https://maplibre.org/maplibre-gl-js/docs/) maps.

<img width="887" alt="Screenshot 2024-11-23 at 00 16 59" src="https://github.com/user-attachments/assets/12496caa-c8f3-451d-8062-2a3a1a1ea44f">


See
[API.md](https://github.com/birkskyum/maplibre-gl-draw/blob/main/markdown-files/API.md) for
documentation.

### Installing

```sh
npx jsr add @birkskyum/maplibre-gl-draw
bunx jsr add @birkskyum/maplibre-gl-draw
deno add jsr:@birkskyum/maplibre-gl-draw
pnpm dlx jsr add @birkskyum/maplibre-gl-draw
yarn dlx jsr add @birkskyum/maplibre-gl-draw
```

MapLibre GL Draw ships with CSS, make sure you include it in your build.

### Usage in your application

#### TypeScript

**When using modules**

```js
import maplibregl from "maplibre-gl";
import { MapLibreDraw } from "@birkskyum/maplibre-gl-draw";
```

**When using a CDN**

#### CSS

**When using modules**

```js
import "@birkskyum/maplibre-gl-draw/dist/maplibre-gl-draw.css";
```

**When using CDN**

### Typescript

The entire library is written in typescript

### Example usage

```js
var map = new maplibregl.Map({
  container: "map",
  style: "https://demotiles.maplibre.org/style.json",
  center: [40, -74.50],
  zoom: 9,
});

var Draw = new MapLibreDraw();

// Map#addControl takes an optional second argument to set the position of the control.
// If no position is specified the control defaults to `top-right`. See the docs
// for more details: https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#addcontrol

map.addControl(Draw, "top-left");

map.on("load", function () {
  // ALL YOUR APPLICATION CODE
});
```

### See [API.md](https://github.com/birkskyum/maplibre-gl-draw/blob/main/markdown-files/API.md) for complete reference.

### Enhancements and New Interactions

For additional functionality
[check out our list of custom modes](https://github.com/birkskyum/maplibre-gl-draw/blob/main/markdown-files/MODES.md#available-custom-modes).

MapLibre Draw accepts functionality changes after the functionality has been
proven out via a
[custom mode](https://github.com/birkskyum/maplibre-gl-draw/blob/main/markdown-files/MODES.md#creating-modes-for-maplibre-draw).
This lets users experiment and validate their mode before entering a review
process, hopefully promoting innovation. When you write a custom mode, please
open a PR adding it to our
[list of custom modes](https://github.com/birkskyum/maplibre-gl-draw/blob/main/markdown-files/MODES.md#available-custom-modes).

### Developing and testing

Install dependencies, build the source files and crank up a server via:

```
git clone git@github.com:birkskyum/maplibre-gl-draw.git
npm ci
npm start & open "http://localhost:9967/debug/"
```

### Testing

```
npm run test
```

### Publishing

Published to JSR automatically, when the version in deno.json is bumped on main thread


### Examples

[the GL JS example](https://codepen.io/birkskyum-1471370946/pen/QWeebqa).

### Naming actions

We're trying to follow standards when naming things. Here is a collection of
links where we look for inspiration.

- https://turfjs.org
- https://shapely.readthedocs.io/en/latest/manual.html
