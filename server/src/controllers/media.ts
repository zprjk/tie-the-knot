import {Request, Response} from 'express';
import formidable from 'formidable';
import fs from 'fs-extra';
import sharp from 'sharp';
import path from 'path';
import {UpldFile} from '../utils/types';
import {ensureSavedFilesExistSync} from '../utils/ensure-saved-files-exist';
import {
  upldArchiveDir,
  upldFilesJson,
  upldOutputDir,
  upldThumbnailDir,
} from '../utils/constants';
import {extFromMimeType} from '../utils/ext-from-mime-type';

const sync = () => {
  fs.ensureDirSync(upldOutputDir);
  fs.ensureDirSync(upldThumbnailDir);
  fs.ensureFileSync(upldFilesJson);
  ensureSavedFilesExistSync();
};

class MediaController {
  constructor() {
    sync();
  }

  /** Get all uploaded files */
  async get(req: Request, res: Response, next: any) {
    try {
      const files = await fs.readJson(upldFilesJson);
      res.json(files);
    } catch (err) {
      sync();
      res.json([]);
    }
  }

  /** Delete an uploaded file */
  async del(req: Request, res: Response, next: any) {
    try {
      const hash = req.params.hash;
      const files = (await fs.readJson(upldFilesJson)) as UpldFile[];
      let fileFound: UpldFile | undefined;

      const result = files.filter((x: UpldFile) => {
        if (x.hash === hash) {
          fileFound = x;
          return false;
        }
        return true;
      });

      await fs.writeJSON(upldFilesJson, result);
      await fs.ensureDir(upldArchiveDir);

      if (fileFound) {
        const fileUrl = fileFound.url.replace('images/', '');
        const src = path.join(upldOutputDir, fileUrl);
        const dest = path.join(upldArchiveDir, fileUrl);
        await fs.move(src, dest, {overwrite: true});
      }

      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  /** Upload a file */
  async post(req: Request, res: Response, next: any) {
    try {
      const form = formidable({
        uploadDir: upldOutputDir,
        keepExtensions: true,
        hashAlgorithm: 'md5',
        multiples: false,
      });

      form.on('file', (name, file) => {
        const beautitySize =
          file.size > 1000000
            ? `(${(file.size * 0.000001).toFixed(2)} MB)`
            : `(${(file.size * 0.001).toFixed(2)} KB)`;

        const beautityName = `"${file.originalFilename}"`;

        console.info('Uploading file:', beautityName, beautitySize);
      });

      form.on('error', (err) => {
        console.error(err);
      });

      const [, parsedfiles] = await form.parse(req);

      const files = Object.values(parsedfiles)
        .filter((x) => {
          return Array.isArray(x);
        })
        .map((x) => {
          return x?.map((z) => z.toJSON());
        })
        .flat();

      if (!files.length) {
        return res.status(400).json({message: 'No files were uploaded.'});
      }

      let result: UpldFile[] = [];

      for (const file of files) {
        const hash = file.hash;
        const oldPath = file.filepath;
        const ext = extFromMimeType(file.mimetype ?? 'n/a');

        if (!hash) {
          return res.status(400).json({message: 'Invalid file hash.'});
        }

        if (!ext) {
          return res.status(400).json({message: 'Invalid file extension.'});
        }

        const newPath = `${upldOutputDir}/${hash}.${ext}`;
        const newThumbnailPath = `${upldThumbnailDir}/${hash}.${ext}`;
        const fileExists = await fs.pathExists(newPath);

        // --- Rename to avoid duplicates ---
        await fs.move(oldPath, newPath, {overwrite: true});

        // --- Generate thumbnail ---
        await sharp(newPath)
          .rotate()
          .resize({width: 200})
          .jpeg({quality: 75})
          .toFile(newThumbnailPath);

        const upldFile: UpldFile = {
          hash,
          ext,
          url: newPath.replace('./public/', ''),
          thumbnail: newThumbnailPath.replace('./public/', ''),
          name: file.originalFilename,
        };

        if (!fileExists) result.push(upldFile);
      }

      const existingFiles =
        (await fs.readJson(upldFilesJson, {throws: false})) || [];
      const newFiles = [...result, ...existingFiles];
      await fs.writeJSON(upldFilesJson, newFiles);

      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

// Singleton
export const mediaController = new MediaController();
