import {
  addToScene,
  attachControl,
  createDefaultCamera,
  createEngine,
  createHemisphericLight,
  createSceneContext,
  loadGltf,
  registerScene,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);

  const model = await loadGltf(engine, "https://playground.babylonjs.com/scenes/BoomBox.glb");
  addToScene(scene, model);

  const camera = createDefaultCamera(scene);
  camera.alpha = 1.78;
  attachControl(camera, canvas, scene);
  addToScene(scene, createHemisphericLight([0, 1, 0], 1.25));

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
