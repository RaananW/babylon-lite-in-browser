import { expect, test } from "@playwright/test";

const renderedExamples = [
  "basic",
  "animation",
  "materials",
  "procedural-geometry",
  "csg",
  "cdn",
  "cdn-unpkg",
  "cdn-jsdelivr",
];
const examples = ["basic", "animation", "model-loading", ...renderedExamples.slice(2)];
const siteUrl = "https://raananw.github.io/babylon-lite-in-browser";

test("the gallery exposes every example", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Babylon Lite/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Babylon Lite");
  await expect(page.locator(".example-card")).toHaveCount(9);
  await expect(page.locator(".example-card").first()).toHaveCSS("background-image", /basic\.png/);
  await expect(page.locator("#package-version")).toContainText("@babylonjs/lite@");
});

test("the gallery publishes search and social metadata", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /3D scenes.*Babylon Lite/i,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${siteUrl}/`);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /Babylon Lite.*3D/i);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", /^https:\/\//);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain(
    "SoftwareSourceCode",
  );
});

test("every example is independently indexable", async ({ page }) => {
  for (const example of examples) {
    await page.goto(`/examples/${example}/`, { waitUntil: "domcontentloaded" });

    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Babylon Lite/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${siteUrl}/examples/${example}/`,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${siteUrl}/assets/previews/${example}.png`,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

test("crawler discovery files expose every public page", async ({ request }) => {
  const robotsResponse = await request.get("/robots.txt");
  const sitemapResponse = await request.get("/sitemap.xml");
  const robots = await robotsResponse.text();
  const sitemap = await sitemapResponse.text();

  expect(robotsResponse.ok()).toBe(true);
  expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`);
  expect(sitemapResponse.ok()).toBe(true);
  expect(sitemapResponse.headers()["content-type"]).toContain("xml");
  expect(sitemap).toContain(`<loc>${siteUrl}/</loc>`);

  for (const example of examples) {
    expect(sitemap).toContain(`<loc>${siteUrl}/examples/${example}/</loc>`);
  }
});

for (const example of renderedExamples) {
  test(`${example} renders with native browser modules`, async ({ page }) => {
    await page.goto(`/examples/${example}/`);

    if (!(await page.evaluate(() => Boolean(navigator.gpu)))) {
      test.skip(true, "The browser runner does not expose WebGPU.");
    }

    await expect(page.locator("#renderCanvas")).toHaveAttribute("data-ready", "true", {
      timeout: 30_000,
    });
    await expect(page.locator("#status")).toContainText("Ready");
  });
}

for (const example of examples) {
  test(`${example} displays its deployed source`, async ({ page }) => {
    await page.goto(`/examples/${example}/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "View source" }).click();

    const sourceDialog = page.getByRole("dialog", { name: "No bundler involved" });
    await expect(sourceDialog).toBeVisible();
    await expect(sourceDialog).toContainText('"@babylonjs/lite"');
    await expect(sourceDialog).toContainText('from "@babylonjs/lite"');
  });
}

for (const [example, artifact] of [
  ["cdn", "https://cdn.jsdelivr.net/npm/@babylonjs/lite@1.28.0/dist/index.js"],
  ["cdn-unpkg", "https://unpkg.com/@babylonjs/lite@1.28.0/dist/index.js"],
  ["cdn-jsdelivr", "https://cdn.jsdelivr.net/npm/@babylonjs/lite@1.28.0/dist/index.js"],
]) {
  test(`${example} maps Babylon Lite to its pinned CDN artifact`, async ({ page }) => {
    await page.goto(`/examples/${example}/`, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "View source" }).click();

    await expect(page.getByRole("dialog", { name: "No bundler involved" })).toContainText(artifact);
  });
}

test("model-loading loads a self-hosted glTF with native browser modules", async ({ page }) => {
  test.skip(
    Boolean(process.env.CI),
    "Babylon Lite loadGltf stalls on GitHub's software WebGPU; exercise it on a hardware GPU.",
  );

  await page.goto("/examples/model-loading/");

  if (!(await page.evaluate(() => Boolean(navigator.gpu)))) {
    test.skip(true, "The browser runner does not expose WebGPU.");
  }

  await expect(page.locator("#renderCanvas")).toHaveAttribute("data-model-loaded", "true", {
    timeout: 30_000,
  });
  await expect(page.locator("#status")).not.toContainText("Error");
});

test("the self-hosted glTF asset is deployable", async ({ request }) => {
  const response = await request.get("/assets/pyramid.gltf");
  const model = await response.json();

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("model/gltf+json");
  expect(model.asset.version).toBe("2.0");
  expect(model.meshes).toHaveLength(1);
  expect(model.buffers[0].uri).toMatch(/^data:application\/octet-stream;base64,/);
});

test("every scene preview is deployable", async ({ request }) => {
  for (const example of examples) {
    const response = await request.get(`/assets/previews/${example}.png`);
    const image = await response.body();

    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("image/png");
    expect(image.byteLength).toBeGreaterThan(1_000);
    expect(image.subarray(1, 4).toString()).toBe("PNG");
    expect(image.readUInt32BE(16)).toBe(960);
    expect(image.readUInt32BE(20)).toBe(640);
  }
});

test("the vendored module is served as JavaScript", async ({ request }) => {
  const response = await request.get("/vendor/@babylonjs/lite/index.js");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("javascript");
  expect((await response.body()).byteLength).toBeGreaterThan(100_000);
});
