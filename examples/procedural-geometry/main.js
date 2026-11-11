import {
  addToScene,
  attachControl,
  createArcRotateCamera,
  createEngine,
  createHemisphericLight,
  createLineSystem,
  createPbrMaterial,
  createPointLight,
  createSceneContext,
  createTube,
  onBeforeRender,
  registerScene,
  setPbrEmissive,
  startEngine,
  updateLineSystem,
} from "@babylonjs/lite";
import { runExample } from "../../shared/run-example.js";

const turns = 4;
const pointCount = 121;

await runExample(async (canvas) => {
  const engine = await createEngine(canvas);
  const scene = createSceneContext(engine);
  scene.clearColor = { r: 0.008, g: 0.018, b: 0.035, a: 1 };

  const camera = createArcRotateCamera(-1.45, 1.25, 12, { x: 0, y: 0, z: 0 });
  scene.camera = camera;
  attachControl(camera, canvas, scene);
  addToScene(scene, createHemisphericLight([0, 1, 0], 0.7));
  addToScene(scene, createPointLight([2, 3, -3], 32));

  const cyan = createPbrMaterial({
    baseColorFactor: [0.03, 0.68, 0.95, 1],
    metallicFactor: 0.35,
    roughnessFactor: 0.2,
  });
  setPbrEmissive(cyan, [0.01, 0.2, 0.35]);

  const magenta = createPbrMaterial({
    baseColorFactor: [0.95, 0.08, 0.48, 1],
    metallicFactor: 0.3,
    roughnessFactor: 0.22,
  });
  setPbrEmissive(magenta, [0.3, 0.01, 0.12]);

  const strandA = helixPath(0);
  const strandB = helixPath(Math.PI);
  const tubeA = createTube(engine, { path: strandA, radius: 0.14, tessellation: 16 });
  const tubeB = createTube(engine, { path: strandB, radius: 0.14, tessellation: 16 });
  tubeA.material = cyan;
  tubeB.material = magenta;
  addToScene(scene, tubeA);
  addToScene(scene, tubeB);

  const rungIndices = Array.from({ length: 17 }, (_, index) => index * 7);
  /** @param {number} phase */
  const createRungs = (phase) =>
    rungIndices.map((index) => {
      const wave = Math.sin(phase + index * 0.28) * 0.12;
      return [
        { ...strandA[index], y: strandA[index].y + wave },
        { ...strandB[index], y: strandB[index].y - wave },
      ];
    });

  const colors = rungIndices.map((_, index) => {
    const mix = index / (rungIndices.length - 1);
    const color = { r: 0.15 + mix * 0.75, g: 0.72 - mix * 0.4, b: 0.95, a: 1 };
    return [color, color];
  });
  const rungs = createLineSystem(engine, { lines: createRungs(0), colors });
  addToScene(scene, rungs);

  let elapsed = 0;
  onBeforeRender(scene, (deltaMilliseconds) => {
    elapsed += Math.min(deltaMilliseconds, 50) / 1000;
    tubeA.rotation.y = elapsed * 0.18;
    tubeB.rotation.y = elapsed * 0.18;
    rungs.rotation.y = elapsed * 0.18;
    updateLineSystem(engine, rungs, { lines: createRungs(elapsed * 2.2), colors });
  });

  await registerScene(scene);
  await startEngine(engine);
  return engine;
});

/** @param {number} phase */
function helixPath(phase) {
  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const angle = progress * turns * Math.PI * 2 + phase;
    return {
      x: Math.cos(angle) * 2,
      y: (progress - 0.5) * 7,
      z: Math.sin(angle) * 2,
    };
  });
}
