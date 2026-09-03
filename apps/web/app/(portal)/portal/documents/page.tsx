'use client';

import { useEffect, useState } from 'react';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Doc = { id: string; filename: string; visibility: string };

export default function PortalDocumentsPage() {
  const [rows, setRows] = useState<Doc[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: Doc[] }>('/portal/documents', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <h1>Documents</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((d) => (
          <li key={d.id}>
            {d.filename} — {d.visibility}
          </li>
        ))}
      </ul>
    </section>
  );
}
