import { convertFromDirectory } from "joi-to-typescript";
import { glob } from "glob";
import { join } from "path";
import fs from "fs/promises";

async function types(): Promise<void> {
  const inputPath = "./src/api/types/RequestShemas";
  const outputPath = "./src/api/types/RequestTypes";

  // const tsfiles = await glob(join(outputPath, "/**/*.ts"));

  // for (let tsfile in tsfiles) {
  //   await fs.writeFile(tsfile, "export {}");
  // }

  // eslint-disable-next-line no-console
  console.log("Running joi-to-typescript...");

  // Configure your settings here
  const result = await convertFromDirectory({
    schemaDirectory: inputPath,
    typeOutputDirectory: outputPath,
    debug: true,
    defaultToRequired: true,
    omitIndexFiles: true,
  });

  if (result) {
    // eslint-disable-next-line no-console
    console.log("Completed joi-to-typescript");
  } else {
    // eslint-disable-next-line no-console
    console.log("Failed to run joi-to-typescript");
  }
}

types();
