import { createServer } from "node:http";
import { mkdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "@playwright/test";

const port = 4174;
const distDirectory = resolve("dist");
const previewDirectory = resolve("public/assets/previews");
const examples = ["basic", "model-loading", "animation", "materials", "procedural-geometry", "csg"];
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gltf": "model/gltf+json",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
};

await mkdir(previewDirectory, { recursive: true });

const server = createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", `http://127.0.0.1:${port}`).pathname);
    const relativePath = pathname.endsWith("/") ? `${pathname}index.html` : pathname;
    const filePath = resolve(distDirectory, `.${relativePath}`);

    if (!filePath.startsWith(`${distDirectory}${sep}`) || !(await stat(filePath)).isFile()) {
      response.writeHead(404).end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": contentTypes[extname(filePath)] ?? "application/octet-stream",
    });
    response.end(await readFile(filePath));
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolveListen) => server.listen(port, "127.0.0.1", resolveListen));

const browser = await chromium.launch({ args: ["--enable-unsafe-webgpu"] });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });

try {
  for (const example of examples) {
    await page.goto(`http://127.0.0.1:${port}/examples/${example}/`);
    await page.locator("#renderCanvas[data-ready='true']").waitFor({ timeout: 45_000 });
    await page.waitForTimeout(500);
    await page.locator("#renderCanvas").screenshot({
      path: join(previewDirectory, `${example}.png`),
    });
    console.log(`Captured ${example}.png`);
  }
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
}
