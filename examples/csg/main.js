import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createCsgFromMesh,
  createCylinder,
  createEngine,
  createHemisphericLight,
  createMeshFromCsg,
  createPbrMaterial,
  createPointLight,
  createSceneContext,
  createSphere,
  createTorus,
  csgSubtract,
  csgUnion,
  onBeforeRender,
  registerScene,
  setPbrClearCoat,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.025, g: 0.012, b: 0.018, a: 1 };

  const camera = createArcRotateCamera(-1.5, 1.12, 8.5, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);
  addToScene(scene, createHemisphericLight([0, 1, 0], 0.75));
  addToScene(scene, createPointLight([-3, 4, -3], 34));
  addToScene(scene, createPointLight([3, -2, 2], 18));

  const sphere = createSphere(engine, { diameter: 3.7, segments: 40 });
  const bore = createCylinder(engine, { height: 5, diameter: 1.35, tessellation: 40 });
  const ring = createTorus(engine, { diameter: 4.2, thickness: 0.62, tessellation: 64 });

  const carvedSphere = csgSubtract(createCsgFromMesh(sphere), createCsgFromMesh(bore));
  const sculptureSolid = csgUnion(carvedSphere, createCsgFromMesh(ring));
  const sculpture = createMeshFromCsg(engine, sculptureSolid, "boolean-sculpture");

  const material = createPbrMaterial({
    baseColorFactor: [0.88, 0.16, 0.28, 1],
    metallicFactor: 0.72,
    roughnessFactor: 0.18,
  });
  setPbrClearCoat(material, { isEnabled: true, intensity: 0.9, roughness: 0.12 });
  sculpture.material = material;
  addToScene(scene, sculpture);

  onBeforeRender(scene, (deltaMilliseconds) => {
    const deltaSeconds = Math.min(deltaMilliseconds, 50) / 1000;
    sculpture.rotation.x += deltaSeconds * 0.18;
    sculpture.rotation.y += deltaSeconds * 0.34;
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
