import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createCylinder,
  createEngine,
  createGround,
  createHemisphericLight,
  createPbrMaterial,
  createPointLight,
  createPolyhedron,
  createSceneContext,
  onBeforeRender,
  registerScene,
  setPbrClearCoat,
  setPbrEmissive,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.035, g: 0.012, b: 0.095, a: 1 };

  const camera = createArcRotateCamera(-1.45, 1.08, 13, { x: 0, y: 1.2, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);

  addToScene(scene, createHemisphericLight([0, 1, 0], 0.55));
  addToScene(scene, createPointLight([-5, 6, -3], 42));
  addToScene(scene, createPointLight([5, 2, 4], 34));

  const ground = createGround(engine, { width: 16, height: 16 });
  ground.material = createPbrMaterial({
    baseColorFactor: [0.025, 0.04, 0.12, 1],
    metallicFactor: 0.45,
    roughnessFactor: 0.32,
  });
  addToScene(scene, ground);

  /** @type {[number, number, number, number][]} */
  const colors = [
    [0.98, 0.12, 0.55, 1],
    [0.12, 0.82, 1, 1],
    [0.64, 0.26, 1, 1],
    [1, 0.62, 0.08, 1],
    [0.18, 1, 0.58, 1],
  ];
  const materials = colors.map((baseColorFactor) => {
    const material = createPbrMaterial({
      baseColorFactor,
      metallicFactor: 0.35,
      roughnessFactor: 0.16,
    });
    setPbrClearCoat(material, { isEnabled: true, intensity: 1, roughness: 0.1 });
    setPbrEmissive(material, [
      baseColorFactor[0] * 0.14,
      baseColorFactor[1] * 0.14,
      baseColorFactor[2] * 0.14,
    ]);
    return material;
  });

  const crystals = Array.from({ length: 18 }, (_, index) => {
    const angle = (index / 18) * Math.PI * 2;
    const innerRing = index % 3 === 0;
    const radius = innerRing ? 2.5 : 4.8;
    const height = 1.5 + ((index * 7) % 5) * 0.42;

    const pedestal = createCylinder(engine, {
      height: 0.35,
      diameterTop: 0.7,
      diameterBottom: 1.1,
      tessellation: 6,
    });
    pedestal.position.set(Math.cos(angle) * radius, 0.18, Math.sin(angle) * radius);
    pedestal.material = materials[(index + 2) % materials.length];
    addToScene(scene, pedestal);

    const crystal = createPolyhedron(engine, {
      type: 8 + (index % 5),
      sizeX: 0.55 + (index % 2) * 0.16,
      sizeY: height,
      sizeZ: 0.55 + (index % 3) * 0.08,
      flat: true,
    });
    crystal.position.set(Math.cos(angle) * radius, 0.65 + height * 0.42, Math.sin(angle) * radius);
    crystal.rotation.y = -angle + index * 0.3;
    crystal.material = materials[index % materials.length];
    addToScene(scene, crystal);
    return crystal;
  });

  let elapsed = 0;
  onBeforeRender(scene, (deltaMilliseconds) => {
    elapsed += Math.min(deltaMilliseconds, 50) / 1000;
    for (const [index, crystal] of crystals.entries()) {
      crystal.rotation.y += 0.002 + (index % 4) * 0.0007;
      crystal.position.y += Math.sin(elapsed * 1.2 + index) * 0.0008;
    }
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
