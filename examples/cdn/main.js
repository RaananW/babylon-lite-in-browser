import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createHemisphericLight,
  createPbrMaterial,
  createPointLight,
  createSceneContext,
  createSphere,
  createTorus,
  onBeforeRender,
  registerScene,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.012, g: 0.025, b: 0.055, a: 1 };

  const camera = createArcRotateCamera(-Math.PI / 2, 1.1, 11, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);

  addToScene(scene, createHemisphericLight([0, 1, 0], 0.7));
  addToScene(scene, createPointLight([-4, 4, -2], 35));
  addToScene(scene, createPointLight([4, -1, 3], 24));

  const ring = createTorus(engine, { diameter: 4.2, thickness: 0.32, tessellation: 64 });
  ring.material = createPbrMaterial({
    baseColorFactor: [0.15, 0.82, 0.95, 1],
    metallicFactor: 0.7,
    roughnessFactor: 0.18,
  });
  addToScene(scene, ring);

  /** @type {[number, number, number, number][]} */
  const colors = [
    [0.95, 0.2, 0.58, 1],
    [0.55, 0.3, 1, 1],
    [1, 0.68, 0.15, 1],
  ];
  const materials = colors.map((baseColorFactor) =>
    createPbrMaterial({ baseColorFactor, metallicFactor: 0.25, roughnessFactor: 0.22 }),
  );
  const satellites = Array.from({ length: 12 }, (_, index) => {
    const satellite = createSphere(engine, { diameter: 0.62, segments: 20 });
    satellite.material = materials[index % materials.length];
    addToScene(scene, satellite);
    return satellite;
  });

  let elapsed = 0;
  onBeforeRender(scene, (deltaMilliseconds) => {
    elapsed += Math.min(deltaMilliseconds, 50) / 1000;
    ring.rotation.x = elapsed * 0.25;
    ring.rotation.y = elapsed * 0.45;

    for (const [index, satellite] of satellites.entries()) {
      const angle = elapsed * 0.35 + (index / satellites.length) * Math.PI * 2;
      satellite.position.set(
        Math.cos(angle) * 3.1,
        Math.sin(angle * 2 + index * 0.35) * 1.1,
        Math.sin(angle) * 3.1,
      );
    }
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
