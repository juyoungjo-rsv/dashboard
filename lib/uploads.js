import path from 'node:path';
import fs from 'node:fs/promises';
import { UPLOADS_DIR } from './db';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_IMAGES_PER_ENTRY = 4;

const EXT_BY_TYPE = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
};

export class UploadError extends Error {}

// Saves an uploaded image (a Web File/Blob from a FormData body) to disk
// under a random name so nothing can be overwritten or guessed, and
// returns the stored file name to persist alongside the diary entry.
export async function saveUploadedImage(file) {
  if (!(file instanceof Blob)) {
    throw new UploadError('올바른 이미지 파일이 아닙니다.');
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError('jpg, png, gif, webp 이미지만 업로드할 수 있어요.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new UploadError('이미지 용량은 8MB를 넘을 수 없어요.');
  }

  const ext = EXT_BY_TYPE[file.type];
  const fileName = `${Date.now()}-${crypto.randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, fileName), buffer);
  return fileName;
}

export async function deleteUploadedImage(fileName) {
  try {
    await fs.unlink(path.join(UPLOADS_DIR, fileName));
  } catch {
    // already gone; ignore
  }
}
