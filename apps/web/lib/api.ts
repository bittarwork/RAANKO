const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {},
): Promise<T> {
  const { token, headers, ...rest } = options;
  const res = await fetch(`${API_URL}/api/v1${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      (body as { message?: string }).message ??
      (body as { error?: string }).error ??
      `Request failed (${res.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
  }
  return body as T;
}

export function getStoredToken(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(key);
}

export function setStoredToken(key: string, token: string) {
  window.localStorage.setItem(key, token);
}

export function clearStoredToken(key: string) {
  window.localStorage.removeItem(key);
}

export const PLATFORM_TOKEN_KEY = 'raanko_platform_token';
export const COMPANY_TOKEN_KEY = 'raanko_company_token';
export const PORTAL_TOKEN_KEY = 'raanko_portal_token';
