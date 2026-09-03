import { describe, it, expect } from 'vitest';
import { createHmac } from 'crypto';
import { signWebhookPayload } from '../src/phase2/webhooks/webhook-signature';

describe('webhook HMAC signature', () => {
  it('signs the payload with HMAC SHA256 hex', () => {
    const secret = 'whsec_test';
    const payload = JSON.stringify({ event: 'ping' });
    const expected = createHmac('sha256', secret).update(payload).digest('hex');
    expect(signWebhookPayload(secret, payload)).toBe(expected);
  });
});
