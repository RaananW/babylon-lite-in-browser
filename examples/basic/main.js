import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createGround,
  createHemisphericLight,
  createPbrMaterial,
  createSceneContext,
  createSphere,
  createStandardMaterial,
  registerScene,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.025, g: 0.03, b: 0.06, a: 1 };

  const camera = createArcRotateCamera(-Math.PI / 2, Math.PI / 2.4, 5, { x: 0, y: 0.5, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);

  addToScene(scene, createHemisphericLight([0, 1, 0], 1));

  const sphere = createSphere(engine, { diameter: 2, segments: 32 });
  sphere.position.y = 0.25;
  sphere.material = createPbrMaterial({
    baseColorFactor: [0.36, 0.23, 0.95, 1],
    metallicFactor: 0.15,
    roughnessFactor: 0.24,
  });
  addToScene(scene, sphere);

  const ground = createGround(engine, { width: 8, height: 8 });
  ground.position.y = -0.8;
  const groundMaterial = createStandardMaterial();
  groundMaterial.diffuseColor = [0.075, 0.085, 0.13];
  ground.material = groundMaterial;
  addToScene(scene, ground);

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
