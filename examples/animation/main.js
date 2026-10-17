import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createBox,
  createEngine,
  createHemisphericLight,
  createPbrMaterial,
  createSceneContext,
  createTorus,
  onBeforeRender,
  registerScene,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.018, g: 0.022, b: 0.04, a: 1 };

  const camera = createArcRotateCamera(-Math.PI / 2, 1.15, 9, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);
  addToScene(scene, createHemisphericLight([0, 1, 0], 1));

  const torus = createTorus(engine, { diameter: 3, thickness: 0.7, tessellation: 48 });
  torus.material = createPbrMaterial({
    baseColorFactor: [0.1, 0.75, 0.9, 1],
    metallicFactor: 0.65,
    roughnessFactor: 0.18,
  });
  addToScene(scene, torus);

  const boxMaterial = createPbrMaterial({
    baseColorFactor: [0.82, 0.25, 0.58, 1],
    metallicFactor: 0.15,
    roughnessFactor: 0.4,
  });
  const boxes = Array.from({ length: 8 }, (_, index) => {
    const box = createBox(engine, { size: 0.65 });
    const angle = (index / 8) * Math.PI * 2;
    box.position.set(Math.cos(angle) * 3, Math.sin(angle * 2) * 0.4, Math.sin(angle) * 3);
    box.material = boxMaterial;
    addToScene(scene, box);
    return box;
  });

  let elapsed = 0;
  onBeforeRender(scene, (deltaMilliseconds) => {
    const deltaSeconds = Math.min(deltaMilliseconds, 50) / 1000;
    elapsed += deltaSeconds;
    torus.rotation.x += deltaSeconds * 0.45;
    torus.rotation.y += deltaSeconds * 0.8;

    for (const [index, box] of boxes.entries()) {
      box.rotation.x += deltaSeconds * (0.3 + index * 0.04);
      box.rotation.y += deltaSeconds * (0.55 + index * 0.03);
      box.position.y = Math.sin(elapsed * 1.8 + index * 0.7) * 0.55;
    }
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
