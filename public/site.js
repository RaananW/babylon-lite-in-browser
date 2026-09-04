const supportStatus = document.querySelector("#webgpu-status");
const packageVersion = document.querySelector("#package-version");

if (supportStatus instanceof HTMLElement) {
  const supported = Boolean(navigator.gpu);
  supportStatus.textContent = supported
    ? "WebGPU is available in this browser."
    : "WebGPU is not available. Use a current Chrome, Edge, Firefox, or Safari release.";
  supportStatus.dataset.supported = String(supported);
}

if (packageVersion instanceof HTMLElement) {
  try {
    const response = await fetch("./vendor/@babylonjs/lite/package.json");
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const packageMetadata = await response.json();
    packageVersion.textContent = `${packageMetadata.name}@${packageMetadata.version}`;
  } catch {
    packageVersion.textContent = "@babylonjs/lite";
  }
}

export {};
