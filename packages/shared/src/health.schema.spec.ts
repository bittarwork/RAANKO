import { describe, it, expect } from 'vitest';
import { healthResponseSchema } from './schemas/health.schema';

describe('healthResponseSchema', () => {
  it('validates a correct health response', () => {
    const payload = {
      data: {
        status: 'ok' as const,
        service: 'raanko-api',
        timestamp: new Date().toISOString(),
      },
      meta: { version: '0.1.0' },
    };

    expect(healthResponseSchema.parse(payload)).toEqual(payload);
  });
});
