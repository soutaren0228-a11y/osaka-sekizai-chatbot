import { build } from "esbuild";

await build({
  entryPoints: ["src/widget/main.ts"],
  bundle: true,
  minify: true,
  format: "iife",
  target: "es2018",
  outfile: "public/widget.js",
});

console.log("widget.js built -> public/widget.js");
