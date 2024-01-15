import { convertFromDirectory } from "joi-to-typescript";
import { glob } from "glob";
import { join, parse } from "path";
import fs from "fs/promises";

async function types(): Promise<void> {
  const inputPath = "./src/api/types/EndpointsApi";
  const outputPath = "./src/api/types/RequestTypes";
  const inputPathAbsolute = join(process.cwd(), inputPath);
  const outputPathAbsolute = join(process.cwd(), outputPath);

  const tsfiles = await glob(join(inputPathAbsolute, "/**/*.ts"), {
    absolute: true,
    nodir: true,
  });

  await fs.rm(outputPath, { force: true, recursive: true });

  // Type files are imported before being created, creating empty modules for all types
  // to be able to execute the joi-to-typescript script, all files will be overwritten
  // once the types are generated
  for (let tsfile of tsfiles) {
    const fileName = parse(tsfile).base;
    let dir = parse(tsfile).dir;
    let pathRecursive = "";
    while (dir != inputPathAbsolute) {
      pathRecursive = join(parse(dir).base, pathRecursive);
      dir = parse(dir).dir;
    }

    const newFileName = join(outputPathAbsolute, pathRecursive, fileName);
    await fs.mkdir(parse(newFileName).dir, { recursive: true });
    await fs.writeFile(newFileName, "export {}");
  }

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
