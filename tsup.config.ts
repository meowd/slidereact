import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["esm", "cjs"],
	dts: true,
	sourcemap: false,
	splitting: false,
	minify: true,
	clean: true,
	target: "es2020",
	external: ["react", "react-dom", "react/jsx-runtime"],
	outDir: "dist",
});
