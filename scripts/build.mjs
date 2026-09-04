import { access, copyFile, cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const publicDirectory = resolve(projectRoot, "public");
const outputDirectory = resolve(projectRoot, "dist");
const liteDirectory = resolve(projectRoot, "node_modules/@babylonjs/lite");
const vendorDirectory = resolve(outputDirectory, "vendor/@babylonjs/lite");

const litePackagePath = resolve(liteDirectory, "package.json");
const liteBundlePath = resolve(liteDirectory, "dist/index.js");
const liteSourceMapPath = resolve(liteDirectory, "dist/index.js.map");

await Promise.all(
  [publicDirectory, litePackagePath, liteBundlePath, liteSourceMapPath].map((path) => access(path)),
);

const litePackage = JSON.parse(await readFile(litePackagePath, "utf8"));

await rm(outputDirectory, { force: true, recursive: true });
await cp(publicDirectory, outputDirectory, { recursive: true });
await mkdir(vendorDirectory, { recursive: true });

await Promise.all([
  copyFile(liteBundlePath, resolve(vendorDirectory, "index.js")),
  copyFile(liteSourceMapPath, resolve(vendorDirectory, "index.js.map")),
  copyFile(resolve(liteDirectory, "LICENSE"), resolve(vendorDirectory, "LICENSE")),
  writeFile(
    resolve(vendorDirectory, "package.json"),
    `${JSON.stringify(
      {
        name: litePackage.name,
        version: litePackage.version,
        license: litePackage.license,
        type: "module",
      },
      null,
      2,
    )}\n`,
  ),
]);

console.log(`Built dist/ with ${litePackage.name}@${litePackage.version}.`);
