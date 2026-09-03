import { createHash, randomBytes } from 'crypto';
import { ulid } from 'ulid';

/** Generate a new ULID primary key. */
export function newId(): string {
  return ulid();
}

/** Opaque refresh token (raw value sent to client). */
export function generateOpaqueToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/** Hash opaque tokens before storage (sha256 hex). */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Hash user-agent for refresh metadata. */
export function hashUserAgent(ua: string | undefined): string | null {
  if (!ua) return null;
  return createHash('sha256').update(ua).digest('hex');
}
