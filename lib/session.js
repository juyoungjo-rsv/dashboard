// Signed session cookies using Web Crypto (works in both the Node.js route
// handler runtime and the Edge middleware runtime, so the logic lives once).
export const SESSION_COOKIE = 'session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error(
      'SESSION_SECRET 환경변수가 설정되어 있지 않습니다. .env.local 파일을 확인하세요.'
    );
  }
  return secret;
}

function toBase64Url(bytes) {
  let binary = '';
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const padded = str
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function hmacKey() {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function createSessionToken(userId) {
  const payload = JSON.stringify({ uid: userId, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const enc = new TextEncoder();
  const payloadB64 = toBase64Url(enc.encode(payload));
  const key = await hmacKey();
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payloadB64));
  return `${payloadB64}.${toBase64Url(sig)}`;
}

export async function verifySessionToken(token) {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sigB64] = token.split('.');
  try {
    const key = await hmacKey();
    const enc = new TextEncoder();
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64Url(sigB64), enc.encode(payloadB64));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadB64)));
    if (!payload.exp || payload.exp < Date.now()) return null;
    return { userId: payload.uid };
  } catch {
    return null;
  }
}
