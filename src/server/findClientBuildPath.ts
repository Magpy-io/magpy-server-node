import { Logger } from '../modules/Logger';
import { pathExists } from '../modules/diskBasicFunctions';
import { join } from 'path';

const BASE_PATH = './client/build';
const FILE_NAME_TO_CHECK = 'index.html';

export async function findClientBuildPath(): Promise<string | null> {
  Logger.info('Looking for client build.');

  const pathLevel0 = await checkPath('.');
  if (pathLevel0) {
    Logger.info('client build found at ' + pathLevel0);
    return pathLevel0;
  }

  const pathLevel1 = await checkPath('..');
  if (pathLevel1) {
    Logger.info('client build found at ' + pathLevel1);
    return pathLevel1;
  }

  const pathLevel2 = await checkPath('../..');
  if (pathLevel2) {
    Logger.info('client build found at ' + pathLevel2);
    return pathLevel2;
  }

  const pathLevel3 = await checkPath('../../..');
  if (pathLevel3) {
    Logger.info('client build found at ' + pathLevel3);
    return pathLevel3;
  }
  return null;
}

async function checkPath(path_p: string) {
  const pathTesting = join(__dirname, path_p, BASE_PATH);
  const exists = await pathExists(join(pathTesting, FILE_NAME_TO_CHECK));
  if (exists) {
    return pathTesting;
  } else {
    return null;
  }
}
