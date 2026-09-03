'use client';

import { useEffect, useState } from 'react';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Invoice = { id: string; number: string; status: string; total: number; outstanding: number };

export default function PortalInvoicesPage() {
  const [rows, setRows] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: Invoice[] }>('/portal/invoices', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <h1>Invoices</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((inv) => (
          <li key={inv.id}>
            {inv.number} — {inv.status} — €{inv.total} outstanding €{inv.outstanding}
          </li>
        ))}
      </ul>
    </section>
  );
}
