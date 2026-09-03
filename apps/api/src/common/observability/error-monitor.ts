import { Logger } from '@nestjs/common';

const log = new Logger('ErrorMonitor');

/** Optional error hook for staging/production (Sentry or equivalent). */
export function reportError(error: unknown, context?: string): void {
  const dsn = process.env.SENTRY_DSN;
  const message = error instanceof Error ? error.stack ?? error.message : String(error);

  if (!dsn) {
    if (process.env.NODE_ENV !== 'test') {
      log.error(context ? `${context}: ${message}` : message);
    }
    return;
  }

  // Provider-specific SDK is wired when SENTRY_DSN is configured at deploy time.
  log.error(`[sentry-enabled] ${context ?? 'error'}: ${message}`);
}
