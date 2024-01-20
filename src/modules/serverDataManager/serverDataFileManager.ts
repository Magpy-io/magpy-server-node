// IMPORTS
import fs from 'fs/promises';
import * as path from 'path';

import * as config from '../../config/config';
import { createFolder, pathExists } from '../diskManager';
import { ServerDataSchema, ServerDataType } from './ServerDataType';
import { SaveServerDataToCache, ServerDataDefault } from './serverDataCached';

let configLoadedFromFile = false;

export async function LoadConfigFile() {
  await CreateFileIfDoesNotExist();
  const configFileData = await getServerDataFromFile();
  const configDataWithDefaults = AddServerDataIfMissing(configFileData);
  SaveServerDataToCache(configDataWithDefaults);
  await SaveServerDataFile(configDataWithDefaults);
  configLoadedFromFile = true;
}

export async function SaveServerDataFile(data: ServerDataType) {
  await CreateFileIfDoesNotExist();

  await fs.writeFile(config.serverDataFile, JSON.stringify(data));
}

export async function ClearServerDataFile() {
  configLoadedFromFile = false;
  await DeleteServerDataFile();
}

export function AssertConfigLoaded() {
  if (!configLoadedFromFile) {
    throw new Error(
      "You need to load config from file 'LoadConfigFile()' before getting or setting any parameters.",
    );
  }
}

async function getServerDataFromFile(): Promise<any> {
  try {
    const buffer = await fs.readFile(config.serverDataFile);

    return JSON.parse(buffer.toString());
  } catch (err) {
    console.error('Error reading ServerData, overwriting server data');
    return {};
  }
}

function AddServerDataIfMissing(data: any): ServerDataType {
  const { error, value } = ServerDataSchema.validate(data);

  if (!error) {
    return value;
  }

  return ServerDataDefault;
}

async function CreateFileIfDoesNotExist() {
  const parsed = path.parse(config.serverDataFile);
  await createFolder(parsed.dir);
  if (!(await pathExists(config.serverDataFile))) {
    await fs.writeFile(config.serverDataFile, JSON.stringify({}));
  }
}

async function DeleteServerDataFile() {
  await fs.rm(config.serverDataFile, { force: true });
}
