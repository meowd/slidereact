import { build } from "esbuild";

/**
 * React 19 no longer ships UMD bundles. The browser build uses the same
 * React 19 instance provided by the host page through globalThis.React.
 * Access is deferred until a component is rendered, so the classic script
 * can be loaded before the CDN module that initializes React.
 */
const reactGlobalPlugin = {
  name: "react-global",
  setup(buildContext) {
    buildContext.onResolve({ filter: /^react(?:\/jsx-runtime|\/jsx-dev-runtime)?$/ }, (args) => ({
      path: args.path,
      namespace: "react-global",
    }));

    buildContext.onLoad({ filter: /.*/, namespace: "react-global" }, (args) => {
      if (args.path === "react") {
        return {
          loader: "js",
          contents: `
            const getReact = () => {
              if (!globalThis.React) {
                throw new Error("the-slidereact: React 19+ must be loaded before rendering.");
              }
              return globalThis.React;
            };
            export const Children = { toArray: (...args) => getReact().Children.toArray(...args) };
            export const useCallback = (...args) => getReact().useCallback(...args);
            export const useEffect = (...args) => getReact().useEffect(...args);
            export const useImperativeHandle = (...args) => getReact().useImperativeHandle(...args);
            export const useMemo = (...args) => getReact().useMemo(...args);
            export const useRef = (...args) => getReact().useRef(...args);
            export const useState = (...args) => getReact().useState(...args);
          `,
        };
      }

      return {
        loader: "js",
        contents: `
          const getReact = () => {
            if (!globalThis.React) {
              throw new Error("the-slidereact: React 19+ must be loaded before rendering.");
            }
            return globalThis.React;
          };
          export const Fragment = Symbol.for("react.fragment");
          export const jsx = (type, props, key) => {
            const { children, ...other } = props || {};
            return getReact().createElement(type, { ...other, key }, children);
          };
          export const jsxs = jsx;
          export const jsxDEV = jsx;
        `,
      };
    });
  },
};

await build({
  entryPoints: ["src/browser.ts"],
  outfile: "dist/index.global.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["es2020"],
  jsx: "automatic",
  minify: true,
  sourcemap: false,
  legalComments: "none",
  plugins: [reactGlobalPlugin],
});

console.log("Browser build: dist/index.global.js (globalThis.TheSlidereact.Slider)");
