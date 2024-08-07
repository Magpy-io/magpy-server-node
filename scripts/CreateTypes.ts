import fs from 'fs/promises';
import { glob } from 'glob';
import { convertFromDirectory } from 'joi-to-typescript';
import { join, parse } from 'path';
import {
  AllExport,
  TypeAliasDeclaration,
  TypescriptParser,
  VariableDeclaration,
} from 'typescript-parser';

const parser = new TypescriptParser();

async function types(): Promise<void> {
  const inputPath = './src/api/Types/EndpointsApi';
  const outputPath = './src/api/Types/RequestTypes';
  const inputPathAbsolute = join(process.cwd(), inputPath);
  const outputPathAbsolute = join(process.cwd(), outputPath);

  const tsfiles = await glob(join(inputPathAbsolute, '/**/*.ts'), {
    absolute: true,
    nodir: true,
    windowsPathsNoEscape: true,
  });

  await fs.rm(outputPath, { force: true, recursive: true });

  // Type files are imported before being created, creating empty modules for all types
  // to be able to execute the joi-to-typescript script, all files will be overwritten
  // once the types are generated
  for (let tsfile of tsfiles) {
    const fileName = parse(tsfile).base;

    verifyFileDeclarations(tsfile);

    let dir = parse(tsfile).dir;
    let pathRecursive = '';
    while (dir != inputPathAbsolute) {
      pathRecursive = join(parse(dir).base, pathRecursive);
      dir = parse(dir).dir;
    }

    const newFileName = join(outputPathAbsolute, pathRecursive, fileName);
    await fs.mkdir(parse(newFileName).dir, { recursive: true });
    await fs.writeFile(newFileName, 'export {}');
  }

  // eslint-disable-next-line no-console
  console.log('Running joi-to-typescript...');

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
    console.log('Completed joi-to-typescript');
  } else {
    // eslint-disable-next-line no-console
    console.log('Failed to run joi-to-typescript');
  }
}

async function verifyFileDeclarations(filePath: string) {
  const fileName = parse(filePath).name;

  const fileStr = await fs.readFile(filePath, { encoding: 'utf-8' });

  const parsed = await parser.parseSource(fileStr);

  const responseDataType = parsed.declarations.find(e => e.name == 'ResponseData');
  const RequestShemaObject = parsed.declarations.find(e => e.name == 'RequestSchema');
  const endpointName = parsed.declarations.find(e => e.name == 'endpoint');
  const tokenAuth = parsed.declarations.find(e => e.name == 'tokenAuth');
  const exportAll = parsed.exports.find(e => e instanceof AllExport);

  if (!responseDataType || !(responseDataType instanceof TypeAliasDeclaration)) {
    throw new Error("ResponseData type must be exported in file '" + filePath + "'");
  }

  if (!RequestShemaObject || !(RequestShemaObject instanceof VariableDeclaration)) {
    throw new Error(
      "RequestSchema object must be defined and exported as a 'Joi.object' in file '" +
        filePath +
        "'",
    );
  }

  if (!endpointName || !(endpointName instanceof VariableDeclaration)) {
    throw new Error(
      "endpoint name string must be exported with same name as file in file '" +
        filePath +
        "'\nexample : 'export const endpoint = '" +
        fileName +
        "';'",
    );
  }

  try {
    const endpointString = fileStr.substring(endpointName.start as number, endpointName.end);

    const endpointStringSplit = endpointString.split(/['"]/);

    if (!endpointStringSplit.includes(fileName)) {
      throw new Error();
    }
  } catch (err) {
    console.log(err);
    throw new Error(
      "endpoint name string must be exported with same name as file in file '" +
        filePath +
        "'\nexample : 'export const endpoint = '" +
        fileName +
        "';'",
    );
  }

  if (!tokenAuth || !(tokenAuth instanceof VariableDeclaration)) {
    throw new Error(
      "tokenAuth of type TokenAuthentification must be declared and exported in file '" +
        filePath +
        "'\nexample : 'export const tokenAuth: TokenAuthentification = 'yes';",
    );
  }

  if (
    !exportAll ||
    !(exportAll instanceof AllExport) ||
    exportAll.from != '../RequestTypes/' + fileName
  ) {
    throw new Error(
      "An export needs to be added with the auto-generated type for the RequestSchema in file '" +
        filePath +
        "'\nexample : 'export * from '../RequestTypes/" +
        fileName +
        ";'",
    );
  }
}

types()
  .then(() => {
    console.log('Finished creating endpoint types');
  })
  .catch(err => {
    console.log('Error while creating endpoint types');
    console.log(err);
  });
