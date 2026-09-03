'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

export default function ReportsPage() {
  const [dashboard, setDashboard] = useState<Record<string, unknown> | null>(null);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: { widgets: Record<string, unknown> } }>('/reports/dashboard', { token })
      .then((res) => setDashboard(res.data.widgets))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    const res = await apiFetch(`/search?q=${encodeURIComponent(q)}`, { token });
    setSearch(res);
  }

  return (
    <section>
      <h1>Reports</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <pre style={{ background: '#fff', padding: 12, border: '1px solid #e2e8f0' }}>
        {dashboard ? JSON.stringify(dashboard, null, 2) : 'Loading widgets…'}
      </pre>
      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" style={inputStyle} />
        <button type="submit">Search</button>
      </form>
      {search ? (
        <pre style={{ background: '#fff', padding: 12, border: '1px solid #e2e8f0', marginTop: 12 }}>
          {JSON.stringify(search, null, 2)}
        </pre>
      ) : null}
    </section>
  );
}

const inputStyle: React.CSSProperties = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6, flex: 1 };
