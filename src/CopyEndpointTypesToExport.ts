import { glob } from "glob";
import { join, parse } from "path";
import fs from "fs/promises";

async function copyFiles(): Promise<void> {
  try {
    const inputPath = "./src/api/Types/";
    const outputPath = "./src/api/export/Types/";

    await fs.rm(outputPath, { force: true, recursive: true });

    await fs.cp(inputPath, outputPath, { recursive: true });
    console.log("Types copied successfully to export folder");
  } catch (err) {
    console.log("Error copying types folder to export");
    console.log(err);
  }
}

copyFiles();
