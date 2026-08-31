import { NextResponse } from 'next/server';
import { requireUser, UnauthorizedError } from '../../../../lib/auth';
import { equipItem, listCharacterState } from '../../../../lib/character';

const ERROR_MESSAGES = {
  ITEM_NOT_FOUND: '존재하지 않는 아이템이에요.',
  NOT_OWNED: '먼저 잠금해제해야 착용할 수 있어요.',
};

export async function POST(request) {
  let user;
  try {
    user = await requireUser();
  } catch (err) {
    if (err instanceof UnauthorizedError) return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    throw err;
  }

  const body = await request.json().catch(() => ({}));
  const itemId = Number(body.itemId);
  if (!Number.isInteger(itemId)) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
  }

  try {
    await equipItem(user.id, itemId);
  } catch (err) {
    const message = ERROR_MESSAGES[err.message] || '아이템을 착용할 수 없어요.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  return NextResponse.json(await listCharacterState(user.id));
}
