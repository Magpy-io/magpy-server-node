import fs from 'fs/promises';
import { glob } from 'glob';
import { join } from 'path';
import { TypescriptParser } from 'typescript-parser';

async function copyFiles(): Promise<void> {
  try {
    const inputPath = './src/api/Types/';
    const outputPath = './src/api/export/Types/';
    const outputPathAbsolute = join(process.cwd(), outputPath);

    await fs.rm(outputPath, { force: true, recursive: true });

    await fs.cp(inputPath, outputPath, { recursive: true });
    console.log('Types copied successfully to export folder');

    await RemovedJoiSchemasFromTypes(outputPathAbsolute);
    console.log('Types files parsed successfully.');
  } catch (err) {
    console.log('Error copying types folder to export');
    console.log(err);
  }
}

async function RemovedJoiSchemasFromTypes(outputPathAbsolute: string) {
  const tsfiles = await glob(join(outputPathAbsolute, 'EndpointsApi', '/**/*.ts'), {
    absolute: true,
    nodir: true,
  });

  const parser = new TypescriptParser();

  for (let tsfile of tsfiles) {
    const fileStr = await fs.readFile(tsfile, { encoding: 'utf-8' });

    const parsed = await parser.parseSource(fileStr);

    const sI = parsed.imports.find(e => e.libraryName == 'joi')?.start as number;
    const eI = parsed.imports.find(e => e.libraryName == 'joi')?.end as number;

    const s = parsed.declarations.find(e => e.name == 'RequestSchema')?.start as number;
    const e = parsed.declarations.find(e => e.name == 'RequestSchema')?.end as number;

    const parsedFile =
      fileStr.substring(0, sI) + fileStr.substring(eI, s) + fileStr.substring(e);

    await fs.writeFile(tsfile, parsedFile);
  }
}

copyFiles()
  .then(() => {
    console.log('Finished copying endpoint types');
  })
  .catch(err => {
    console.log('Error while copying endpoint types');
    console.log(err);
  });
