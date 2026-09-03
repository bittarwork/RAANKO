'use client';

import { useEffect, useState } from 'react';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Quote = { id: string; status: string; totals?: { sellTotal?: number } };

export default function PortalQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Quote[] }>('/portal/quotes', { token });
    setQuotes(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function act(id: string, action: 'accept' | 'decline') {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) return;
    await apiFetch(`/portal/quotes/${id}/${action}`, { method: 'POST', token });
    await load(token);
  }

  return (
    <section>
      <h1>Quotes</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {quotes.map((q) => (
          <li key={q.id}>
            {q.id.slice(-8)} — {q.status}
            {q.totals?.sellTotal != null ? ` — €${q.totals.sellTotal}` : ''}
            {q.status === 'sent' ? (
              <>
                <button type="button" style={{ marginLeft: 8 }} onClick={() => act(q.id, 'accept')}>Accept</button>
                <button type="button" style={{ marginLeft: 8 }} onClick={() => act(q.id, 'decline')}>Decline</button>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
