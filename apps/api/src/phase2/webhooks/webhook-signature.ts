import { createHmac } from 'crypto';

/** HMAC-SHA256 hex digest for webhook payloads. */
export function signWebhookPayload(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}
