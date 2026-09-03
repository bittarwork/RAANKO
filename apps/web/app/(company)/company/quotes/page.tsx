'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

type Quote = {
  id: string;
  status: string;
  versionNumber: number;
  totals?: { sellTotal?: number; margin?: number };
};

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [description, setDescription] = useState('Freight');
  const [sellAmount, setSellAmount] = useState('100');
  const [buyAmount, setBuyAmount] = useState('80');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Quote[] }>('/quotes', { token });
    setQuotes(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed'),
    );
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      await apiFetch('/quotes', {
        method: 'POST',
        token,
        body: JSON.stringify({
          customerId: customerId || undefined,
          currency: 'EUR',
          lines: [
            {
              description,
              sellAmount: Number(sellAmount),
              buyAmount: Number(buyAmount),
            },
          ],
        }),
      });
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function send(id: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch(`/quotes/${id}/send`, { method: 'POST', token });
    await load(token);
  }

  return (
    <section>
      <h1>Quotes</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul style={{ marginTop: 12 }}>
        {quotes.map((q) => (
          <li key={q.id} style={{ marginBottom: 8 }}>
            {q.id.slice(-8)} — {q.status} v{q.versionNumber}
            {q.totals?.sellTotal != null ? ` — sell €${q.totals.sellTotal}` : ''}
            {q.totals?.margin != null ? ` — margin €${q.totals.margin}` : ''}
            {q.status === 'draft' ? (
              <button type="button" style={{ marginLeft: 8 }} onClick={() => send(q.id)}>
                Send
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginTop: 16, maxWidth: 360 }}>
        <input
          value={customerId}
          onChange={(e) => setCustomerId(e.target.value)}
          placeholder="Customer id (optional)"
          style={inputStyle}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Line description"
          required
          style={inputStyle}
        />
        <input
          value={sellAmount}
          onChange={(e) => setSellAmount(e.target.value)}
          placeholder="Sell amount EUR"
          required
          style={inputStyle}
        />
        <input
          value={buyAmount}
          onChange={(e) => setBuyAmount(e.target.value)}
          placeholder="Buy amount EUR"
          required
          style={inputStyle}
        />
        <button type="submit">Create draft quote</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
