import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createCapsule,
  createEngine,
  createHemisphericLight,
  createPbrMaterial,
  createPointLight,
  createSceneContext,
  createSphere,
  createTorus,
  onBeforeRender,
  registerScene,
  setPbrEmissive,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.005, g: 0.055, b: 0.075, a: 1 };

  const camera = createArcRotateCamera(-Math.PI / 2, 1.12, 13, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);

  addToScene(scene, createHemisphericLight([0, 1, 0], 0.6));
  addToScene(scene, createPointLight([-4, 4, -4], 45));
  addToScene(scene, createPointLight([4, -2, 3], 32));

  /** @type {[number, number, number, number][]} */
  const colors = [
    [0.05, 0.95, 1, 1],
    [1, 0.12, 0.62, 1],
    [0.72, 0.3, 1, 1],
    [1, 0.7, 0.08, 1],
  ];
  const materials = colors.map((baseColorFactor) => {
    const material = createPbrMaterial({
      baseColorFactor,
      metallicFactor: 0.5,
      roughnessFactor: 0.15,
    });
    setPbrEmissive(material, [
      baseColorFactor[0] * 0.18,
      baseColorFactor[1] * 0.18,
      baseColorFactor[2] * 0.18,
    ]);
    return material;
  });

  const core = createSphere(engine, { diameter: 2.2, segments: 36 });
  core.material = materials[3];
  addToScene(scene, core);

  const rings = [3.8, 5.8].map((diameter, index) => {
    const ring = createTorus(engine, { diameter, thickness: index ? 0.12 : 0.2, tessellation: 72 });
    ring.rotation.x = index ? 1.05 : 0.35;
    ring.rotation.z = index ? 0.45 : -0.55;
    ring.material = materials[index];
    addToScene(scene, ring);
    return ring;
  });

  const orbiters = Array.from({ length: 16 }, (_, index) => {
    const orbiter = createCapsule(engine, {
      height: 1.1 + (index % 3) * 0.24,
      radius: 0.2,
      tessellation: 16,
    });
    orbiter.material = materials[index % materials.length];
    addToScene(scene, orbiter);
    return orbiter;
  });

  let elapsed = 0;
  onBeforeRender(scene, (deltaMilliseconds) => {
    elapsed += Math.min(deltaMilliseconds, 50) / 1000;
    core.rotation.y += 0.006;
    rings[0].rotation.y = elapsed * 0.3;
    rings[1].rotation.y = -elapsed * 0.22;

    for (const [index, orbiter] of orbiters.entries()) {
      const progress = index / orbiters.length;
      const angle = progress * Math.PI * 2 + elapsed * (index % 2 ? 0.18 : -0.14);
      const radius = index % 2 ? 4.3 : 3.1;
      orbiter.position.set(
        Math.cos(angle) * radius,
        Math.sin(angle * 3 + elapsed) * 1.45,
        Math.sin(angle) * radius,
      );
      orbiter.rotation.x = angle;
      orbiter.rotation.z = angle * 0.7;
    }
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
