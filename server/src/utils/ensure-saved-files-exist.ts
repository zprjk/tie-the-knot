import fs from 'fs-extra';
import {UpldBaseDir, upldFilesJson, upldOutputDir} from './constants';
import {UpldFile} from './types';
import path from 'path';

/* Ensure files from json file exist, if don't remove from json */
export function ensureSavedFilesExistSync() {
  try {
    const files: UpldFile[] =
      fs.readJSONSync(upldFilesJson, {throws: false}) || [];
    const newFiles = files.filter((file: UpldFile) => {
      const filePath = path.join(UpldBaseDir, file.url);

      return fs.existsSync(filePath);
    });

    fs.writeJSONSync(upldFilesJson, newFiles);
  } catch (err) {
    console.error(err);
  }
}
