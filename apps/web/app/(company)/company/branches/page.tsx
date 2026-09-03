'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

type Branch = { id: string; name: string; code: string | null; isMain: boolean; city: string | null };

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Branch[] }>('/organization/branches', { token });
    setBranches(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      await apiFetch('/organization/branches', {
        method: 'POST',
        token,
        body: JSON.stringify({ name }),
      });
      setName('');
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <h1>Branches</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul style={{ marginTop: 12 }}>
        {branches.map((b) => (
          <li key={b.id}>
            {b.name} {b.isMain ? '(Main)' : ''} {b.city ? `— ${b.city}` : ''}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New branch name"
          required
          style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <button type="submit">Add branch</button>
      </form>
    </section>
  );
}
