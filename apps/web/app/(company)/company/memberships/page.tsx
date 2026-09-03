'use client';

import { useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken, setStoredToken } from '@/lib/api';

type MembershipRow = {
  id: string;
  tenantSlug: string;
  tenantName: string;
  roleKey: string;
  status: string;
};

export default function MembershipsPage() {
  const [rows, setRows] = useState<MembershipRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: MembershipRow[] }>('/auth/memberships', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function switchTo(membershipId: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    setMessage(null);
    try {
      const res = await apiFetch<{ data: { accessToken: string } }>('/auth/switch-tenant', {
        method: 'POST',
        token,
        body: JSON.stringify({ membershipId }),
      });
      setStoredToken(COMPANY_TOKEN_KEY, res.data.accessToken);
      setMessage('Session switched. Reload other company pages to use the new tenant.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <h1>Memberships</h1>
      <p style={{ color: '#64748b' }}>
        Listing does not change the current session until you explicitly switch.
      </p>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {message ? <p style={{ color: '#15803d' }}>{message}</p> : null}
      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        {rows.map((row) => (
          <li key={row.id}>
            {row.tenantName} ({row.tenantSlug}) — {row.roleKey}{' '}
            <button type="button" onClick={() => switchTo(row.id)}>
              Switch
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
