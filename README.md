# Babylon Lite in the browser

[**View the live examples on GitHub Pages**](https://raananw.github.io/babylon-lite-in-browser/)

Use [Babylon Lite](https://github.com/BabylonJS/Babylon-Lite) directly from a browser
`<script type="module">`, with no application bundler and no framework.

This repository is the Babylon Lite counterpart to
[babylonjs-esm-in-browser](https://github.com/RaananW/babylonjs-esm-in-browser). It uses the
official browser distribution included in `@babylonjs/lite`, a browser import map, and a small
static build step that copies files without transforming your application code.

> Babylon Lite is WebGPU-only. Use a current Chrome, Edge, Firefox, or Safari release and serve the
> project from `localhost` or HTTPS.

## Quick start

Requirements:

- Node.js `^20.19`, `^22.13`, or `>=24`
- pnpm 11 (the exact version is declared in `package.json`)
- A browser with WebGPU support

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The development command creates `dist/` and serves it as ordinary
static files. It does not bundle, compile, or rewrite the example modules.

For a production build:

```bash
pnpm build
pnpm preview
```

Everything needed for deployment is in `dist/`.

## Examples

| Example                                         | What it demonstrates                                                |
| ----------------------------------------------- | ------------------------------------------------------------------- |
| [Basic scene](public/examples/basic/)           | Engine, scene, camera, light, PBR material, geometry, and lifecycle |
| [Model loading](public/examples/model-loading/) | glTF loading, self-hosted assets, and automatic camera framing      |
| [Animation](public/examples/animation/)         | Procedural updates through `onBeforeRender` and shared materials    |

Every example is plain HTML and JavaScript. View its `index.html` and `main.js` together; there is
no generated application source to decipher.

## How direct browser imports work

Node understands a bare package name such as `@babylonjs/lite`, but browsers need a URL. Each
example bridges that gap with an import map:

```html
<script type="importmap">
  {
    "imports": {
      "@babylonjs/lite": "../../vendor/@babylonjs/lite/index.js"
    }
  }
</script>
<script type="module" src="./main.js"></script>
```

The application module can then use normal package imports:

```js
import {
  addToScene,
  createEngine,
  createHemisphericLight,
  createSceneContext,
  registerScene,
  startEngine,
} from "@babylonjs/lite";

const canvas = document.querySelector("canvas");
const engine = await createEngine(canvas);
const scene = createSceneContext(engine);

addToScene(scene, createHemisphericLight([0, 1, 0], 1));

await registerScene(scene);
await startEngine(engine);
```

`pnpm build` copies `node_modules/@babylonjs/lite/dist/index.js` to
`dist/vendor/@babylonjs/lite/index.js`. That `dist/index.js` file is Babylon Lite's official,
self-contained browser distribution, also identified by its npm package metadata as the jsDelivr
and unpkg entry point.

### Use the CDN instead

For a small prototype, map the package directly to the pinned CDN artifact and skip the local copy:

```html
<script type="importmap">
  {
    "imports": {
      "@babylonjs/lite": "https://cdn.jsdelivr.net/npm/@babylonjs/lite@1.27.0/dist/index.js"
    }
  }
</script>
```

Pin an exact version in deployed applications. A local copy is preferable when you need repeatable
deployments, offline development, control over caching, or a strict Content Security Policy.

## The Babylon Lite lifecycle

Lite uses plain data and standalone functions rather than class instances with methods. The scene
owns its cameras, lights, meshes, and loaded assets. A typical application has four phases:

1. Create the WebGPU engine with `await createEngine(canvas)`.
2. Create a scene, then create and add its content.
3. Call `await registerScene(scene)` after the initial content is present.
4. Call `await startEngine(engine)` to begin rendering.

Adding initial content after registration is a common reason for missing objects. See the official
[Getting Started guide](https://doc.babylonjs.com/lite/01-getting-started/) for the API's mental
model and lifecycle details.

## No-bundler tradeoffs

Babylon Lite is designed to be tree-shaken by a bundler. A browser cannot tree-shake an ES module,
so these examples use the complete minified browser distribution. This is ideal for learning,
prototypes, scriptable pages, and environments where a build pipeline is undesirable, but it is
not the smallest possible production payload.

Use Vite or another ESM-aware bundler when download size is more important than a build-free
application architecture. Your scene code can keep the same named imports.

## Project structure

```text
.
├── public/
│   ├── assets/            # Self-hosted assets used by the examples
│   ├── examples/          # Browser-native example pages and modules
│   ├── shared/            # Shared example shell and error/status handling
│   └── index.html         # Example gallery
├── scripts/
│   └── build.mjs          # Static copy step; no application bundling
├── tests/
│   └── site.spec.mjs      # Gallery, asset, and WebGPU smoke tests
├── dist/                  # Generated deployable site (gitignored)
└── package.json
```

## Commands

| Command             | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `pnpm dev`          | Build and serve the site at `http://localhost:5173`             |
| `pnpm build`        | Recreate `dist/` and copy the official Lite browser artifact    |
| `pnpm preview`      | Serve an existing production build at `http://localhost:4173`   |
| `pnpm lint`         | Lint source, scripts, configuration, and tests                  |
| `pnpm typecheck`    | Type-check the JavaScript examples with Lite's TypeScript types |
| `pnpm format:check` | Verify formatting                                               |
| `pnpm test`         | Run browser smoke tests against the production build            |
| `pnpm check`        | Run all validation in dependency order                          |

The browser tests expect `dist/` to exist, so run `pnpm build` before `pnpm test`, or use
`pnpm check`.

## Updating Babylon Lite

Update the dependency and regenerate the lockfile:

```bash
pnpm update @babylonjs/lite --latest
pnpm check
```

If you use the CDN import-map example from this README, update its pinned version at the same time.
The local examples read the installed package version automatically during the build.

## Deployment

The included GitHub Actions workflow validates every pull request. On pushes to `main`, it publishes
the contents of `dist/` to an orphan `ghpages` branch. The branch contains only the generated site,
not the project source or its history.

After the workflow creates the branch:

1. Open **Settings → Pages** in the GitHub repository.
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Select the `ghpages` branch and the `/(root)` folder, then save.

GitHub Pages will publish the branch at
`https://<owner>.github.io/<repository>/`. All URLs are relative, so the site works under both a
domain root and a repository subpath.

Any static host can serve `dist/`. JavaScript files must be returned with a JavaScript MIME type,
and the page must run on HTTPS (or `localhost`) so WebGPU is available.

## Troubleshooting

### `navigator.gpu` is missing

Update the browser and confirm WebGPU is enabled for the platform. WebGPU requires a secure context:
use HTTPS in production or `localhost` for local development. Babylon Lite has no WebGL fallback.

### The page is blank when opened from disk

Do not open `index.html` with a `file://` URL. Browser module security rules and remote asset loading
require an HTTP server. Run `pnpm dev`.

### The browser cannot resolve `@babylonjs/lite`

Run `pnpm build` and verify that `dist/vendor/@babylonjs/lite/index.js` exists. Import maps must
appear before the module script that uses them.

### A model does not load

Check the network panel for missing files or Content Security Policy failures. The example uses a
self-hosted glTF with an embedded buffer, so it requires no cross-origin model requests.

### Error messages contain only a number

Lite keeps production errors compact. Import and call `enableErrorDecoding()` during development,
or use `decodeError(error)` for a caught error. See the
[error handling documentation](https://doc.babylonjs.com/lite/architecture/49-error-handling/).

## License

This example project is available under the [MIT License](LICENSE). Babylon Lite has its own
Apache-2.0 license, copied alongside the generated vendor file in `dist/`.
