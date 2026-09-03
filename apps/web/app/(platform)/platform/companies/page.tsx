'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  apiFetch,
  getStoredToken,
  PLATFORM_TOKEN_KEY,
} from '@/lib/api';

type TenantRow = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  writeMode: string;
  subscription: { status: string; planCode: string; trialEndsAt: string | null } | null;
};

export default function CompaniesPage() {
  const [tenants, setTenants] = useState<TenantRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated — sign in first.');
      return;
    }
    apiFetch<{ data: TenantRow[] }>('/platform/tenants', { token })
      .then((res) => setTenants(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem' }}>Companies</h1>
        <Link href="/platform/companies/new" style={{ color: '#93c5fd' }}>
          Create company
        </Link>
      </div>
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
      <table style={{ width: '100%', marginTop: '1rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #334155' }}>
            <th style={th}>Name</th>
            <th style={th}>Slug</th>
            <th style={th}>Status</th>
            <th style={th}>Write mode</th>
            <th style={th}>Plan</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #1e293b' }}>
              <td style={td}>
                <Link href={`/platform/companies/${t.id}`} style={{ color: '#93c5fd' }}>
                  {t.displayName}
                </Link>
              </td>
              <td style={td}>{t.slug}</td>
              <td style={td}>{t.status}</td>
              <td style={td}>{t.writeMode}</td>
              <td style={td}>{t.subscription?.planCode ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!error && tenants.length === 0 ? (
        <p style={{ color: '#94a3b8', marginTop: '1rem' }}>No companies yet.</p>
      ) : null}
    </section>
  );
}

const th: React.CSSProperties = { padding: '0.5rem', fontWeight: 600 };
const td: React.CSSProperties = { padding: '0.5rem', fontSize: '0.95rem' };
