import fs from 'fs/promises';
require('dotenv').config();

async function copyFiles(inputPath: string, outputPath: string): Promise<void> {
  await fs.rm(outputPath, { force: true, recursive: true });
  await fs.cp(inputPath, outputPath, { recursive: true });
}

async function main() {
  if (!process.env.BUNDLE_OUTPUT_FOLDER) {
    console.log('BUNDLE_OUTPUT_FOLDER env var not defined.');
    process.exit(1);
  }

  if (!process.env.COPY_BUNDLE_TO) {
    console.log('COPY_BUNDLE_TO env var not defined.');
    process.exit(1);
  }

  await copyFiles(process.env.BUNDLE_OUTPUT_FOLDER, process.env.COPY_BUNDLE_TO);
  console.log('Bundle copied successfully to', process.env.COPY_BUNDLE_TO);

  if (process.env.COPY_BUNDLE_TO_ADDITIONAL) {
    await copyFiles(process.env.BUNDLE_OUTPUT_FOLDER, process.env.COPY_BUNDLE_TO_ADDITIONAL);
    console.log('Bundle copied successfully to', process.env.COPY_BUNDLE_TO_ADDITIONAL);
  }
}

main().catch(e => {
  console.error('Failed to copy bundle', e);
});
