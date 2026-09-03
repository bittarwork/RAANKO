'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Invoice = { id: string; number: string; status: string; total: number; outstanding: number };

export default function FinancePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [subtotal, setSubtotal] = useState('100');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Invoice[] }>('/finance/invoices', { token });
    setInvoices(res.data);
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
    await apiFetch('/finance/invoices', {
      method: 'POST',
      token,
      body: JSON.stringify({ customerId, subtotal: Number(subtotal), currency: 'EUR' }),
    });
    await load(token);
  }

  async function issue(id: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch(`/finance/invoices/${id}/issue`, { method: 'POST', token });
    await load(token);
  }

  return (
    <section>
      <h1>Finance</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {invoices.map((inv) => (
          <li key={inv.id}>
            {inv.number} — {inv.status} — €{inv.total} outstanding €{inv.outstanding}
            {inv.status === 'draft' ? (
              <button type="button" style={{ marginLeft: 8 }} onClick={() => issue(inv.id)}>
                Issue
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input value={customerId} onChange={(e) => setCustomerId(e.target.value)} placeholder="Customer id" required style={inputStyle} />
        <input value={subtotal} onChange={(e) => setSubtotal(e.target.value)} placeholder="Subtotal EUR" required style={inputStyle} />
        <button type="submit">Create draft invoice</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 };
