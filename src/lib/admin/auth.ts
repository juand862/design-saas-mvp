// Auth del módulo /admin.
//
// MVP: una credencial hardcodeada (admin / Admin123*) con override por env
// vars si se setean. Cuando llegue Supabase + Auth en Fase 3, este módulo
// se reemplaza por la integración real (sin tocar middleware ni API).
//
// Cookie: `canvas_admin_session` con valor `<user>.<hmac>`. Httponly, lax,
// secure en prod. La firma se valida con HMAC-SHA256(SECRET) usando Web
// Crypto (compatible con Edge y Node runtime).

const ENV_USER = process.env.ADMIN_USER;
const ENV_PASSWORD = process.env.ADMIN_PASSWORD;
const ENV_SECRET = process.env.ADMIN_SESSION_SECRET;

export const ADMIN_USER = ENV_USER ?? 'admin';
const ADMIN_PASSWORD = ENV_PASSWORD ?? 'Admin123*';
const SESSION_SECRET = ENV_SECRET ?? 'canvas-saas-dev-secret-change-me';

export const SESSION_COOKIE_NAME = 'canvas_admin_session';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 horas

/** Verifica usuario + contraseña contra los valores configurados. */
export function verifyCredentials(user: string, password: string): boolean {
  return user === ADMIN_USER && password === ADMIN_PASSWORD;
}

/** Firma un valor con HMAC-SHA256 usando Web Crypto. */
async function hmac(value: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(value));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Devuelve el valor del cookie a setear tras login exitoso. */
export async function buildSessionCookieValue(user: string): Promise<string> {
  const sig = await hmac(user);
  return `${user}.${sig}`;
}

/** Devuelve el username si el cookie es válido, null si no. */
export async function verifySessionCookieValue(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const dot = value.indexOf('.');
  if (dot <= 0) return null;
  const user = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  const expected = await hmac(user);
  if (!constantTimeEquals(sig, expected)) return null;
  return user;
}

/** Comparación de strings tiempo-constante para evitar timing attacks. */
function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
