import { expect, test } from "@playwright/test";

test("the gallery exposes every example", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Babylon Lite/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Babylon Lite");
  await expect(page.locator(".example-card")).toHaveCount(3);
  await expect(page.locator("#package-version")).toContainText("@babylonjs/lite@");
});

for (const example of ["basic", "animation"]) {
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

test("model-loading loads a self-hosted glTF with native browser modules", async ({ page }) => {
  await page.goto("/examples/model-loading/");

  if (!(await page.evaluate(() => Boolean(navigator.gpu)))) {
    test.skip(true, "The browser runner does not expose WebGPU.");
  }

  await expect(page.locator("#renderCanvas")).toHaveAttribute("data-model-loaded", "true", {
    timeout: 30_000,
  });
  await expect(page.locator("#status")).not.toContainText("Error");
});

test("the vendored module is served as JavaScript", async ({ request }) => {
  const response = await request.get("/vendor/@babylonjs/lite/index.js");

  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("javascript");
  expect((await response.body()).byteLength).toBeGreaterThan(100_000);
});
