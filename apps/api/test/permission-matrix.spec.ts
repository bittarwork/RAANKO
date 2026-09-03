import { describe, it, expect } from 'vitest';
import { ALL_TENANT_PERMISSION_KEYS } from '@raanko/shared';
import { ROLE_PERMISSION_MATRIX } from '../src/tenants/seed/role-permission.matrix';

describe('Permission matrix seed', () => {
  it('covers every catalog permission key', () => {
    const missing = ALL_TENANT_PERMISSION_KEYS.filter(
      (key) => !(key in ROLE_PERMISSION_MATRIX),
    );
    expect(missing).toEqual([]);
  });
});
