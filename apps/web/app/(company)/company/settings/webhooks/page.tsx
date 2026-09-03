'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type WebhookRow = {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
};

export default function WebhooksSettingsPage() {
  const [rows, setRows] = useState<WebhookRow[]>([]);
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState('shipment.status,invoice.issued');
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function load(token: string) {
    apiFetch<{ data: WebhookRow[] }>('/webhooks', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      const res = await apiFetch<{ data: { secret?: string } }>('/webhooks', {
        method: 'POST',
        token,
        body: JSON.stringify({
          url,
          events: events.split(',').map((item) => item.trim()).filter(Boolean),
        }),
      });
      setSecret(res.data.secret ?? null);
      setUrl('');
      load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <p>
        <Link href="/company/settings">Back to settings</Link>
      </p>
      <h1>Webhooks</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {secret ? (
        <p style={{ color: '#15803d' }}>
          Signing secret (shown once): <code>{secret}</code>
        </p>
      ) : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 480, marginTop: 16 }}>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/hooks" style={inputStyle} />
        <input value={events} onChange={(e) => setEvents(e.target.value)} placeholder="event names, comma separated" style={inputStyle} />
        <button type="submit">Create endpoint</button>
      </form>
      <ul style={{ marginTop: 16 }}>
        {rows.map((row) => (
          <li key={row.id}>
            {row.url} ({row.isActive ? 'active' : 'inactive'}) — {row.events.join(', ')}
          </li>
        ))}
      </ul>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
