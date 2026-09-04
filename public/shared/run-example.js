import { resizeEngine } from "@babylonjs/lite";

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
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(error);
    status.textContent = `Error: ${message}`;
    status.dataset.state = "error";
  }
}
