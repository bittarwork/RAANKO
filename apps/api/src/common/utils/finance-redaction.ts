import { TenantPermissions } from '@raanko/shared';
import type { AuthContext } from '../types/auth-context';

export function canViewBuyPrices(auth: AuthContext): boolean {
  return auth.permissions.has(TenantPermissions.FINANCE_BUY_PRICES_VIEW);
}

export function canViewMargins(auth: AuthContext): boolean {
  return auth.permissions.has(TenantPermissions.FINANCE_MARGINS_VIEW);
}

export function toMoneyNumber(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value);
  if (typeof value === 'object' && value !== null && 'toNumber' in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(value);
}
