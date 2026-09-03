'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  PORTAL_TOKEN_KEY,
  setStoredToken,
} from '@/lib/api';

export default function PortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{ data: { accessToken: string } }>(
        '/auth/portal/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, tenantSlug }),
        },
      );
      setStoredToken(PORTAL_TOKEN_KEY, res.data.accessToken);
      router.push('/portal');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Customer portal login</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360, marginTop: 16 }}>
        <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="Company slug" required style={inputStyle} />
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" required style={inputStyle} />
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" required minLength={8} style={inputStyle} />
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
