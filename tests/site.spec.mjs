import { expect, test } from "@playwright/test";

const renderedExamples = ["basic", "animation", "materials", "procedural-geometry", "csg", "cdn"];
const examples = ["basic", "animation", "model-loading", "materials", "procedural-geometry", "csg", "cdn"];

test("the gallery exposes every example", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Babylon Lite/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Babylon Lite");
  await expect(page.locator(".example-card")).toHaveCount(7);
  await expect(page.locator(".example-card").first()).toHaveCSS("background-image", /basic\.png/);
  await expect(page.locator("#package-version")).toContainText("@babylonjs/lite@");
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

test("the CDN example maps Babylon Lite to a pinned jsDelivr artifact", async ({ page }) => {
  await page.goto("/examples/cdn/", { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "View source" }).click();

  await expect(page.getByRole("dialog", { name: "No bundler involved" })).toContainText(
    "https://cdn.jsdelivr.net/npm/@babylonjs/lite@1.27.0/dist/index.js",
  );
});

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
