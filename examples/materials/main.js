import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createHemisphericLight,
  createPbrMaterial,
  createPointLight,
  createSceneContext,
  createTorusKnot,
  onBeforeRender,
  registerScene,
  setPbrClearCoat,
  setPbrIridescence,
  setPbrSheen,
  startEngine,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.018, g: 0.012, b: 0.04, a: 1 };

  const camera = createArcRotateCamera(-Math.PI / 2, 1.18, 11, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);

  addToScene(scene, createHemisphericLight([0, 1, 0], 0.8));
  addToScene(scene, createPointLight([-4, 4, -2], 38));
  addToScene(scene, createPointLight([4, -2, 3], 24));

  /** @type {Array<{ color: [number, number, number, number], apply(material: ReturnType<typeof createPbrMaterial>): void }>} */
  const finishes = [
    {
      color: [0.16, 0.48, 0.95, 1],
      apply(material) {
        setPbrClearCoat(material, { isEnabled: true, intensity: 1, roughness: 0.08 });
      },
    },
    {
      color: [0.62, 0.08, 0.36, 1],
      apply(material) {
        setPbrSheen(material, {
          isEnabled: true,
          color: [1, 0.22, 0.62],
          intensity: 1,
          roughness: 0.25,
        });
      },
    },
    {
      color: [0.16, 0.08, 0.22, 1],
      apply(material) {
        setPbrIridescence(material, {
          isEnabled: true,
          intensity: 1,
          indexOfRefraction: 1.35,
          minimumThickness: 180,
          maximumThickness: 520,
        });
      },
    },
  ];

  const knots = finishes.map((finish, index) => {
    const material = createPbrMaterial({
      baseColorFactor: finish.color,
      metallicFactor: 0.55,
      roughnessFactor: 0.22,
    });
    finish.apply(material);

    const knot = createTorusKnot(engine, {
      radius: 1.1,
      tube: 0.27,
      radialSegments: 96,
      tubularSegments: 24,
      p: 2,
      q: 3,
    });
    knot.position.x = (index - 1) * 3.3;
    knot.material = material;
    addToScene(scene, knot);
    return knot;
  });

  onBeforeRender(scene, (deltaMilliseconds) => {
    const deltaSeconds = Math.min(deltaMilliseconds, 50) / 1000;
    for (const [index, knot] of knots.entries()) {
      knot.rotation.x += deltaSeconds * (0.18 + index * 0.05);
      knot.rotation.y += deltaSeconds * (0.3 + index * 0.07);
    }
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});
