import path from 'node:path';
import fs from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { UPLOADS_DIR } from '../../../../lib/db';

const SAFE_NAME = /^[A-Za-z0-9_.-]+$/;

const CONTENT_TYPE_BY_EXT = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function GET(request, { params }) {
  const { filename } = params;

  if (!SAFE_NAME.test(filename) || filename.includes('..')) {
    return NextResponse.json({ error: '잘못된 파일명입니다.' }, { status: 400 });
  }

  const filePath = path.join(UPLOADS_DIR, filename);

  try {
    const data = await fs.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();
    return new NextResponse(data, {
      headers: {
        'Content-Type': CONTENT_TYPE_BY_EXT[ext] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: '파일을 찾을 수 없습니다.' }, { status: 404 });
  }
}
