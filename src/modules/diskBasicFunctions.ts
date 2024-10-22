import fs from 'fs/promises';
import * as path from 'path';

export async function pathExists(pathToTest: string) {
  try {
    await fs.access(pathToTest, fs.constants.F_OK);
    return true;
  } catch (err) {
    return false;
  }
}

export async function folderHasRights(dirPath: string) {
  try {
    const filename = 'Test_file_e3673f84-6c7b-4db4-a9ec-0d3207feb286.txt';
    const filePath = path.join(dirPath, filename);

    let fh = await fs.open(filePath, 'a');
    await fh.close();
    await fs.rm(filePath, { force: true });

    return true;
  } catch (err) {
    return false;
  }
}

export async function createFolder(dirPath: string) {
  const exists = await pathExists(dirPath);

  if (!exists) {
    await fs.mkdir(dirPath, { recursive: true });
  }
}
