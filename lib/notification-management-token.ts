import 'server-only';
import crypto from 'crypto';

import bcrypt from 'bcryptjs';

const TOKEN_BYTES = 32;
const TOKEN_PREFIX = 'cpn';
const BCRYPT_COST = 12;

export function createNotificationManagementToken(): string {
  return `${TOKEN_PREFIX}_${crypto.randomBytes(TOKEN_BYTES).toString('base64url')}`;
}

export function hashNotificationManagementToken(token: string): string {
  return bcrypt.hashSync(token, BCRYPT_COST);
}

export function getNotificationManagementToken(
  request: Request,
  body?: { managementToken?: unknown }
): string | null {
  const headerToken = request.headers.get('x-notification-token')?.trim();
  if (headerToken) return headerToken;

  const bodyToken = body?.managementToken;
  if (typeof bodyToken === 'string' && bodyToken.trim()) {
    return bodyToken.trim();
  }

  return null;
}

export function verifyNotificationManagementToken(
  providedToken: string | null,
  storedHash?: string | null
): boolean {
  if (!providedToken || !storedHash) {
    return false;
  }

  return bcrypt.compareSync(providedToken, storedHash);
}
