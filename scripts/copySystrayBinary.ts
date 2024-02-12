import fs from 'fs/promises';

import { join } from 'path';

async function copyFiles(): Promise<void> {
  try {
    const binLinux = 'systrayhelper';
    const binWindows = 'systrayhelper.exe';
    const inputPath = './node_modules/forked-systray/';
    const outputPath = './out/lib';

    let binName = '';
    if (process.platform == 'win32') {
      binName = binWindows;
    } else if (process.platform == 'linux') {
      binName = binLinux;
    } else {
      throw new Error(
        "Platform '" +
          process.platform +
          "' not supported by package 'forked-systray', you might need to compile binaries manually for you platform, see Readme file of the package",
      );
    }

    const inputPathAbsolute = join(process.cwd(), inputPath, binName);
    const outputPathAbsolute = join(process.cwd(), outputPath);

    await fs.rm(outputPathAbsolute, { force: true, recursive: true });

    try {
      await fs.access(inputPathAbsolute, fs.constants.F_OK);
    } catch (e) {
      console.log(
        'Error: Binary file ' +
          inputPathAbsolute +
          " does not exist, make sure packages are installed 'yarn install'",
      );
      process.exit(1);
    }

    await fs.cp(inputPathAbsolute, join(outputPath, binName));

    console.log("Binaries for 'forked-systray' package successfully copied to out/lib.");
  } catch (err) {
    console.log("Error copying binaries for package 'forked-systray'");
    console.log(err);
  }
}

copyFiles();
