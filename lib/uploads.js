import { put, del } from '@vercel/blob';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
export const MAX_IMAGES_PER_ENTRY = 4;

const EXT_BY_TYPE = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

export class UploadError extends Error {}

// Saves an uploaded image (a Web File/Blob from a FormData body) to Vercel
// Blob storage, which — unlike local disk — survives redeploys on hosts
// with no persistent filesystem. Vercel adds a random suffix to the path,
// so the resulting URL isn't guessable even though blobs are public.
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
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new UploadError(
      '이미지 업로드가 아직 설정되지 않았어요. (Vercel 프로젝트에서 Blob 저장소를 연결해주세요.)'
    );
  }

  const ext = EXT_BY_TYPE[file.type];
  const pathname = `diary/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const blob = await put(pathname, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteUploadedImage(url) {
  try {
    await del(url);
  } catch {
    // already gone; ignore
  }
}
