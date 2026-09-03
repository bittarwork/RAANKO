import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import type { AuthContext } from '../types/auth-context';
import { AUTH_CONTEXT_KEY } from '../types/auth-context';

export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext => {
    const request = ctx.switchToHttp().getRequest<{
      [AUTH_CONTEXT_KEY]?: AuthContext;
    }>();
    return request[AUTH_CONTEXT_KEY] as AuthContext;
  },
);

export const PERMISSION_KEY = 'required_permission';
export const RequirePermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);

export const IS_PUBLIC_KEY = 'is_public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
