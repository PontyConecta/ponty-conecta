/**
 * Hash an email for Meta Pixel Advanced Matching.
 * Returns lowercase hex SHA-256 of the trimmed, lowercased email,
 * or null if the input is invalid.
 */
export async function hashEmailForPixel(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return null;
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(normalized)
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}