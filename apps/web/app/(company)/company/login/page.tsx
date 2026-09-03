'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  setStoredToken,
} from '@/lib/api';

export default function CompanyLoginPage() {
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
      const res = await apiFetch<{ data: { accessToken: string; tenant?: { onboardingStep?: string } } }>(
        '/auth/company/login',
        {
          method: 'POST',
          body: JSON.stringify({ email, password, tenantSlug }),
        },
      );
      setStoredToken(COMPANY_TOKEN_KEY, res.data.accessToken);
      router.push('/company/onboarding');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1>Company login</h1>
      <p style={{ color: '#64748b' }}>Sign in with your company workspace slug.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 360, marginTop: 16 }}>
        <label>
          Tenant slug
          <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} required style={inputStyle} />
        </label>
        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required style={inputStyle} />
        </label>
        <label>
          Password
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required minLength={8} style={inputStyle} />
        </label>
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
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
  padding: '0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};

const buttonStyle: React.CSSProperties = {
  padding: '0.6rem 1rem',
  background: '#0f766e',
  color: 'white',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
};
