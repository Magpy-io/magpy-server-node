import fs from 'fs/promises';

async function copyFiles(inputPath: string, outputPath: string): Promise<void> {
  await fs.rm(outputPath, { force: true, recursive: true });
  await fs.cp(inputPath, outputPath, { recursive: true });
}

if (process.argv.length >= 4) {
  const srcPath = process.argv[2];
  const destPath = process.argv[3];

  copyFiles(srcPath, destPath)
    .then(() => {
      console.log('Finished copying folder ' + srcPath + ' to location ' + destPath);
    })
    .catch(err => {
      console.log('Error while copying folder ' + srcPath);
      console.log(err);
    });
} else {
  console.log('CopyFolder: this script is expecting two parameters, a src and dest paths.');
}
