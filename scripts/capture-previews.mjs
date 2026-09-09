import { createServer } from "node:http";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { extname, join, resolve, sep } from "node:path";
import { chromium } from "@playwright/test";

const port = 4174;
const distDirectory = resolve("dist");
const previewDirectory = resolve("public/assets/previews");
const examples = ["basic", "model-loading", "animation", "materials", "procedural-geometry", "csg", "cdn"];
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

const browser = await chromium.launch({ headless: false, args: ["--enable-unsafe-webgpu"] });
const page = await browser.newPage({ viewport: { width: 960, height: 640 } });

try {
  for (const example of examples) {
    await page.goto(`http://127.0.0.1:${port}/examples/${example}/?capture-preview`);
    const image = page.locator("#previewCapture");
    const errorStatus = page.locator("#status[data-state='error']");
    await image.or(errorStatus).waitFor({ timeout: 45_000 });
    if (await errorStatus.isVisible()) {
      throw new Error((await errorStatus.textContent()) ?? `${example} preview capture failed.`);
    }

    const brightness = await image.evaluate((source) => {
      const sample = source.ownerDocument.createElement("canvas");
      sample.width = 120;
      sample.height = 80;
      const context = sample.getContext("2d");
      if (!context) {
        throw new Error("Unable to create a 2D context for preview validation.");
      }

      context.drawImage(source, 0, 0, sample.width, sample.height);
      const pixels = context.getImageData(0, 0, sample.width, sample.height).data;
      let brightPixels = 0;
      for (let index = 0; index < pixels.length; index += 4) {
        if (Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) > 80) {
          brightPixels++;
        }
      }
      return brightPixels / (pixels.length / 4);
    });

    if (brightness < 0.04) {
      throw new Error(`${example} preview is too dark (${(brightness * 100).toFixed(1)}% bright pixels).`);
    }

    await writeFile(join(previewDirectory, `${example}.png`), await image.screenshot({ type: "png" }));
    console.log(`Captured ${example}.png (${(brightness * 100).toFixed(1)}% bright pixels)`);
  }
} finally {
  await browser.close();
  await new Promise((resolveClose, reject) =>
    server.close((error) => (error ? reject(error) : resolveClose())),
  );
}
