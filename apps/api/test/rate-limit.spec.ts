import { describe, it, expect, beforeEach } from 'vitest';
import { HttpException } from '@nestjs/common';
import { RateLimitService } from '../src/common/rate-limit/rate-limit.service';

describe('RateLimitService', () => {
  let limiter: RateLimitService;

  beforeEach(() => {
    limiter = new RateLimitService();
  });

  it('allows requests under the limit', () => {
    limiter.consume('auth:1.1.1.1', 3, 60_000);
    limiter.consume('auth:1.1.1.1', 3, 60_000);
    expect(() => limiter.consume('auth:1.1.1.1', 3, 60_000)).not.toThrow();
  });

  it('blocks auth bursts over the limit', () => {
    limiter.consume('auth:ip', 2, 60_000);
    limiter.consume('auth:ip', 2, 60_000);
    expect(() => limiter.consume('auth:ip', 2, 60_000)).toThrow(HttpException);
  });

  it('isolates public tracking keys from auth keys', () => {
    limiter.consume('auth:ip', 1, 60_000);
    expect(() => limiter.consume('track:ip', 1, 60_000)).not.toThrow();
  });
});
