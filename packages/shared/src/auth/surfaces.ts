/** Auth surface namespaces — tokens must not cross surfaces. */
export const AuthSurface = {
  PLATFORM: 'platform',
  COMPANY: 'company',
  PORTAL: 'portal',
} as const;

export type AuthSurface = (typeof AuthSurface)[keyof typeof AuthSurface];

/** Tenant write modes from subscription / lifecycle. */
export const WriteMode = {
  FULL: 'full',
  READ_ONLY: 'read_only',
  BLOCKED: 'blocked',
} as const;

export type WriteMode = (typeof WriteMode)[keyof typeof WriteMode];

/** Platform role keys. */
export const PlatformRole = {
  SUPER_ADMIN: 'super_admin',
  SUPPORT_AGENT: 'support_agent',
} as const;

export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

/** Membership status values. */
export const MembershipStatus = {
  INVITED: 'invited',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  REMOVED: 'removed',
} as const;

export type MembershipStatus =
  (typeof MembershipStatus)[keyof typeof MembershipStatus];

/** Tenant lifecycle status. */
export const TenantStatus = {
  TRIAL: 'trial',
  ACTIVE: 'active',
  READ_ONLY: 'read_only',
  SUSPENDED: 'suspended',
  CANCELLED: 'cancelled',
  ARCHIVED: 'archived',
} as const;

export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];
