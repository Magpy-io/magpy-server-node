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
    const filename = 'tmpFileForTestingAccessToFolder.txt';
    const filePath = path.join(dirPath, filename);
    let fileExists = false;

    if (await pathExists(filePath)) {
      fileExists = true;
    }

    let fh = await fs.open(filePath, 'a');
    await fh.close();

    if (!fileExists) {
      await fs.rm(filePath, { force: true });
    }

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
