'use client';

import { useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Note = { id: string; title: string; body: string | null; readAt: string | null; entityType: string | null; entityId: string | null };

export default function NotificationsPage() {
  const [rows, setRows] = useState<Note[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Note[] }>('/notifications', { token });
    setRows(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function markRead(id: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch(`/notifications/${id}/read`, { method: 'POST', token });
    await load(token);
  }

  return (
    <section>
      <h1>Notifications</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((n) => (
          <li key={n.id} style={{ marginBottom: 8 }}>
            <strong>{n.title}</strong> {n.body ?? ''}
            {n.entityType ? ` — ${n.entityType}:${n.entityId}` : ''}
            {!n.readAt ? (
              <button type="button" style={{ marginLeft: 8 }} onClick={() => markRead(n.id)}>
                Mark read
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
