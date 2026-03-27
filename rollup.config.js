const { MINIFY } = process.env;
const minified = MINIFY === "true";
const outputFile = minified
  ? "dist/maplibre-gl-draw.js"
  : "dist/maplibre-gl-draw-unminified.js";

import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import terser from "@rollup/plugin-terser";
import typescript from "@rollup/plugin-typescript";

export default {
  input: ["./src/index.ts"],
  output: {
    file: outputFile,
    format: "es",
    sourcemap: true,
    indent: false,
  },
  treeshake: true,
  plugins: [
    {
      name: "svg-string",
      transform(code, id) {
        if (id.endsWith(".svg")) {
          return `export default ${JSON.stringify(code)};`;
        }
      },
    },
    minified
      ? terser({
        ecma: 2020,
        module: true,
      })
      : false,
    resolve({
      browser: true,
      preferBuiltins: true,
    }),
    commonjs({
      // global keyword handling causes Webpack compatibility issues, so we disabled it:
      // https://github.com/birkskyum/maplibre-gl-js/pull/6956
      ignoreGlobal: true,
    }),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: true,
      declarationDir: "dist",
    }),
  ],
};
