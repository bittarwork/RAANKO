'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type DomainRow = {
  id: string;
  hostname: string;
  status: string;
  verifiedAt: string | null;
};

export default function DomainsSettingsPage() {
  const [rows, setRows] = useState<DomainRow[]>([]);
  const [hostname, setHostname] = useState('');
  const [error, setError] = useState<string | null>(null);

  function load(token: string) {
    apiFetch<{ data: DomainRow[] }>('/settings/domains', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      await apiFetch('/settings/domains', {
        method: 'POST',
        token,
        body: JSON.stringify({ hostname }),
      });
      setHostname('');
      load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <p>
        <Link href="/company/settings">Back to settings</Link>
      </p>
      <h1>Custom domains</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 420, marginTop: 16 }}>
        <input
          value={hostname}
          onChange={(e) => setHostname(e.target.value)}
          placeholder="ops.example.com"
          style={inputStyle}
        />
        <button type="submit">Save hostname</button>
      </form>
      <ul style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <li key={row.id}>
            {row.hostname} — {row.status}
          </li>
        ))}
      </ul>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
