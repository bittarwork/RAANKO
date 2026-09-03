'use client';

import { FormEvent, useEffect, useState } from 'react';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Doc = { id: string; filename: string; visibility: string; generated: boolean };

export default function DocumentsPage() {
  const [rows, setRows] = useState<Doc[]>([]);
  const [entityType, setEntityType] = useState('quote');
  const [entityId, setEntityId] = useState('');
  const [filename, setFilename] = useState('note.txt');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Doc[] }>('/documents', { token });
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

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch('/documents/upload', {
      method: 'POST',
      token,
      body: JSON.stringify({
        entityType,
        entityId,
        filename,
        visibility: 'internal',
        contentBase64: btoa('sample'),
      }),
    });
    await load(token);
  }

  return (
    <section>
      <h1>Documents</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((d) => (
          <li key={d.id}>
            {d.filename} — {d.visibility}
            {d.generated ? ' (generated)' : ''}
          </li>
        ))}
      </ul>
      <form onSubmit={onUpload} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="Entity type" style={inputStyle} />
        <input value={entityId} onChange={(e) => setEntityId(e.target.value)} placeholder="Entity id" required style={inputStyle} />
        <input value={filename} onChange={(e) => setFilename(e.target.value)} placeholder="Filename" style={inputStyle} />
        <button type="submit">Upload</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = { padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 };
