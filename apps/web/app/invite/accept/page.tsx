'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Suspense } from 'react';

function AcceptInviteForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => params.get('token') ?? '', [params]);
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/auth/invitations/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password, firstName, lastName }),
      });
      setDone(true);
      setTimeout(() => router.push('/company/login'), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <main style={{ maxWidth: 420, margin: '3rem auto', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Accept invitation</h1>
      <p style={{ color: '#64748b' }}>Set your password to join the company workspace.</p>
      {done ? (
        <p style={{ color: '#15803d' }}>Accepted. Redirecting to company login…</p>
      ) : (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <input value={token} readOnly style={{ padding: 8, opacity: 0.7 }} />
          <input
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            style={{ padding: 8 }}
          />
          <input
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            style={{ padding: 8 }}
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password (min 8)"
            minLength={8}
            required
            style={{ padding: 8 }}
          />
          {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
          <button type="submit">Accept &amp; set password</button>
        </form>
      )}
    </main>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
