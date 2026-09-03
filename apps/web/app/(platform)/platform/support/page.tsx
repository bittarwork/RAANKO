'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, getStoredToken, PLATFORM_TOKEN_KEY } from '@/lib/api';

type Ticket = { id: string; tenantId: string; subject: string; status: string };

export default function PlatformSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [reply, setReply] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Ticket[] }>('/platform/support/tickets', { token });
    setTickets(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated — sign in first.');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onReply(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token || !selected) return;
    await apiFetch(`/platform/support/tickets/${selected}/reply`, {
      method: 'POST',
      token,
      body: JSON.stringify({ body: reply }),
    });
    setReply('');
    await load(token);
  }

  return (
    <section>
      <h1 style={{ fontSize: '1.75rem' }}>Support tickets</h1>
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
      <ul>
        {tickets.map((t) => (
          <li key={t.id} style={{ marginBottom: 8 }}>
            <button type="button" onClick={() => setSelected(t.id)} style={{ color: '#93c5fd' }}>
              {t.subject} — {t.status}
            </button>
          </li>
        ))}
      </ul>
      {selected ? (
        <form onSubmit={onReply} style={{ display: 'grid', gap: 8, maxWidth: 420, marginTop: 16 }}>
          <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply" required style={{ minHeight: 80 }} />
          <button type="submit">Send reply</button>
        </form>
      ) : null}
    </section>
  );
}
