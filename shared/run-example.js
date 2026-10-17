import { captureScreenshot, resizeEngine } from "@babylonjs/lite";

/**
 * @param {(canvas: HTMLCanvasElement) => Promise<Awaited<ReturnType<typeof import("@babylonjs/lite").createEngine>>>} initialize
 */
export async function runExample(initialize) {
  const canvas = document.querySelector("#renderCanvas");
  const status = document.querySelector("#status");

  if (!(canvas instanceof HTMLCanvasElement) || !(status instanceof HTMLElement)) {
    throw new Error("The example shell is missing its canvas or status element.");
  }

  if (!navigator.gpu) {
    status.textContent = "WebGPU unavailable";
    status.dataset.state = "error";
    return;
  }

  try {
    const engine = await initialize(canvas);
    const resize = () => resizeEngine(engine);

    window.addEventListener("resize", resize);
    canvas.dataset.ready = "true";
    status.textContent = "Ready";
    status.dataset.state = "ready";

    if (new URLSearchParams(window.location.search).has("capture-preview")) {
      await exposeGpuCapture(engine);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    status.textContent = `Error: ${message}`;
    status.dataset.state = "error";
  }
}

/**
 * Converts Babylon Lite's GPU readback into a regular image that browser automation can capture.
 * @param {Awaited<ReturnType<typeof import("@babylonjs/lite").createEngine>>} engine
 */
async function exposeGpuCapture(engine) {
  const capture = await captureScreenshot(engine);
  const captureCanvas = document.createElement("canvas");
  captureCanvas.width = capture.width;
  captureCanvas.height = capture.height;

  const context = captureCanvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to create a 2D context for the scene preview.");
  }

  context.putImageData(
    new ImageData(new Uint8ClampedArray(capture.data), capture.width, capture.height),
    0,
    0,
  );

  const image = new Image();
  image.id = "previewCapture";
  image.alt = "";
  image.src = captureCanvas.toDataURL("image/png");
  Object.assign(image.style, {
    position: "fixed",
    zIndex: "100",
    inset: "0",
    width: "100vw",
    height: "100vh",
    objectFit: "cover",
  });
  await image.decode();
  document.body.append(image);
}
