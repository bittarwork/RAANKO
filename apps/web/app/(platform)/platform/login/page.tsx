'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  PLATFORM_TOKEN_KEY,
  setStoredToken,
} from '@/lib/api';

export default function PlatformLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@raanko.com');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        data: { accessToken: string };
      }>('/auth/platform/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          ...(totpCode ? { totpCode } : {}),
        }),
      });
      setStoredToken(PLATFORM_TOKEN_KEY, res.data.accessToken);
      router.push('/platform/companies');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Platform login</h1>
      <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>
        Super Admin access to provision and manage companies.
      </p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 360 }}>
        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
            style={inputStyle}
          />
        </label>
        <label>
          Password
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            minLength={8}
            style={inputStyle}
          />
        </label>
        <label>
          2FA code (if enabled)
          <input
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            style={inputStyle}
          />
        </label>
        {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: '0.5rem 0.65rem',
  borderRadius: 6,
  border: '1px solid #475569',
  background: '#1e293b',
  color: '#f8fafc',
};

const buttonStyle: React.CSSProperties = {
  padding: '0.65rem 1rem',
  borderRadius: 6,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600,
};
