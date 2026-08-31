import { NextResponse } from 'next/server';
import { requireUser, UnauthorizedError } from '../../../lib/auth';
import { listCharacterState } from '../../../lib/character';

export async function GET() {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    throw err;
  }

  const state = listCharacterState(user.id);
  return NextResponse.json(state);
}
