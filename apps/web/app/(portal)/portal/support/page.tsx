'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

type RequestRow = { id: string; subject: string; status: string };

export default function PortalSupportPage() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: RequestRow[] }>('/portal/support', { token });
    setRows(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) return;
    await apiFetch('/portal/support', {
      method: 'POST',
      token,
      body: JSON.stringify({ subject, body }),
    });
    setSubject('');
    setBody('');
    await load(token);
  }

  return (
    <section>
      <h1>Support</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((r) => (
          <li key={r.id}>
            {r.subject} — {r.status}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required style={inputStyle} />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message" required style={{ ...inputStyle, minHeight: 80 }} />
        <button type="submit">Send request</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 };
