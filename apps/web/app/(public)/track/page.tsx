'use client';

import { FormEvent, useState } from 'react';
import { apiFetch } from '@/lib/api';

type PublicTrack = {
  trackingNumber: string;
  status: string;
  origin: string | null;
  destination: string | null;
  mode: string | null;
  events: Array<{ occurredAt: string; status: string; message: string | null }>;
};

export default function PublicTrackPage() {
  const [tenantSlug, setTenantSlug] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState<PublicTrack | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiFetch<{ data: PublicTrack }>(
        `/public/track/${encodeURIComponent(trackingNumber)}?tenantSlug=${encodeURIComponent(tenantSlug)}`,
      );
      setResult(res.data);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Not found');
    }
  }

  return (
    <main
      style={{
        fontFamily: 'Segoe UI, sans-serif',
        maxWidth: 640,
        margin: '2rem auto',
        padding: '0 1rem',
        color: '#0f172a',
      }}
    >
      <h1>Public tracking</h1>
      <p style={{ color: '#64748b' }}>Enter the company slug and tracking number. Amounts are never shown.</p>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, marginTop: 16 }}>
        <input
          value={tenantSlug}
          onChange={(e) => setTenantSlug(e.target.value)}
          placeholder="Company slug"
          required
          style={inputStyle}
        />
        <input
          value={trackingNumber}
          onChange={(e) => setTrackingNumber(e.target.value)}
          placeholder="Tracking number"
          required
          style={inputStyle}
        />
        <button type="submit">Track</button>
      </form>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {result ? (
        <section style={{ marginTop: 24 }}>
          <p>
            <strong>{result.trackingNumber}</strong> — {result.status}
          </p>
          <p>
            {result.origin} → {result.destination} ({result.mode})
          </p>
          <ul>
            {result.events.map((ev, i) => (
              <li key={`${ev.status}-${i}`}>
                {ev.status}: {ev.message ?? ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
