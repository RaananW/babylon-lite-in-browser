const exampleBar = document.querySelector(".example-bar");
const importMap = document.querySelector('script[type="importmap"]');

if (!(exampleBar instanceof HTMLElement) || !(importMap instanceof HTMLScriptElement)) {
  throw new Error("The source viewer requires an example bar and an import map.");
}

const sourceButton = document.createElement("button");
sourceButton.className = "source-button";
sourceButton.type = "button";
sourceButton.textContent = "View source";
sourceButton.setAttribute("aria-haspopup", "dialog");
exampleBar.insertBefore(sourceButton, exampleBar.querySelector("#status"));

const dialog = document.createElement("dialog");
dialog.className = "source-dialog";
dialog.setAttribute("aria-labelledby", "source-dialog-title");

const dialogHeader = document.createElement("header");
const titleGroup = document.createElement("div");
const eyebrow = document.createElement("p");
eyebrow.className = "source-eyebrow";
eyebrow.textContent = "Deployed source";
const title = document.createElement("h1");
title.id = "source-dialog-title";
title.textContent = "No bundler involved";
const closeButton = document.createElement("button");
closeButton.className = "source-close";
closeButton.type = "button";
closeButton.textContent = "Close";
closeButton.addEventListener("click", () => dialog.close());

titleGroup.append(eyebrow, title);
dialogHeader.append(titleGroup, closeButton);

const explanation = document.createElement("p");
explanation.className = "source-explanation";
explanation.textContent =
  "These are the exact files your browser loaded. The import map resolves the package name, and main.js runs unchanged as a native ES module.";

const importMapSection = createCodeSection("index.html — import map");
importMapSection.code.textContent = `<script type="importmap">\n${importMap.textContent.trim()}\n</script>\n<script type="module" src="./main.js"></script>`;

const moduleSection = createCodeSection("main.js");
moduleSection.code.textContent = "Loading source...";

dialog.append(dialogHeader, explanation, importMapSection.section, moduleSection.section);
document.body.append(dialog);

let sourcePromise;
sourceButton.addEventListener("click", () => {
  dialog.showModal();
  sourcePromise ??= loadModuleSource(moduleSection.code);
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    dialog.close();
  }
});

/**
 * @param {HTMLElement} code
 */
async function loadModuleSource(code) {
  try {
    const response = await fetch(new URL("./main.js", document.baseURI));
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    code.textContent = await response.text();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    code.textContent = `Unable to load main.js: ${message}`;
  }
}

/**
 * @param {string} heading
 */
function createCodeSection(heading) {
  const section = document.createElement("section");
  section.className = "source-section";
  const title = document.createElement("h2");
  title.textContent = heading;
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  pre.append(code);
  section.append(title, pre);
  return { section, code };
}
