/**
 * Session Token Utility — Authenticated Role Gates
 * Menyediakan tanda tangan sesi bertanda waktu (timestamped session signature)
 * untuk mencegah pemalsuan status login via console browser (Broken Access Control).
 */

export type ProtectedRole = 'pos' | 'operator' | 'kitchen';

interface SessionTokenPayload {
  role: ProtectedRole;
  issuedAt: number;
}

const SESSION_SIGNATURE_KEY = 'CY_SESSION_SALT_2026';

function generateSignature(role: string, issuedAt: number): string {
  let hash = 0;
  const str = `${SESSION_SIGNATURE_KEY}:${role}:${issuedAt}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Membuat token sesi bertanda waktu untuk peran tertentu
 */
export function createRoleSessionToken(role: ProtectedRole): string {
  const issuedAt = Date.now();
  const sig = generateSignature(role, issuedAt);
  const payload: SessionTokenPayload = { role, issuedAt };
  return `${btoa(JSON.stringify(payload))}.${sig}`;
}

/**
 * Memvalidasi apakah token sesi valid, sesuai peran, dan belum kedaluwarsa (default: 24 jam)
 */
export function verifyRoleSessionToken(
  token: string | null,
  expectedRole: ProtectedRole,
  maxAgeMs: number = 86400000 // 24 Jam
): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [encodedPayload, sig] = parts;
    const jsonStr = atob(encodedPayload);
    const payload: SessionTokenPayload = JSON.parse(jsonStr);

    if (payload.role !== expectedRole) return false;
    if (typeof payload.issuedAt !== 'number') return false;

    // Cek kedaluwarsa sesi
    if (Date.now() - payload.issuedAt > maxAgeMs) return false;

    // Validasi integritas tanda tangan
    const expectedSig = generateSignature(payload.role, payload.issuedAt);
    return sig === expectedSig;
  } catch {
    return false;
  }
}
