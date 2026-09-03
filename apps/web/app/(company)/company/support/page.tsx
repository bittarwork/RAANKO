'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Ticket = { id: string; subject: string; status: string };
type RequestRow = { id: string; subject: string; status: string };

export default function CompanySupportPage() {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const reqs = await apiFetch<{ data: RequestRow[] }>('/support/requests', { token });
    const tix = await apiFetch<{ data: Ticket[] }>('/support/raanko-tickets', { token });
    setRequests(reqs.data);
    setTickets(tix.data);
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onTicket(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch('/support/raanko-tickets', {
      method: 'POST',
      token,
      body: JSON.stringify({ subject, body }),
    });
    await load(token);
  }

  return (
    <section>
      <h1>Support</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <h2>Customer requests</h2>
      <ul>
        {requests.map((r) => (
          <li key={r.id}>
            {r.subject} — {r.status}
          </li>
        ))}
      </ul>
      <h2>RAANKO tickets</h2>
      <ul>
        {tickets.map((t) => (
          <li key={t.id}>
            {t.subject} — {t.status}
          </li>
        ))}
      </ul>
      <form onSubmit={onTicket} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required style={inputStyle} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" required style={{ ...inputStyle, minHeight: 80 }} />
        <button type="submit">Open RAANKO ticket</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 };
