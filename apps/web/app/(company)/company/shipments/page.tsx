'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

type Shipment = {
  id: string;
  trackingNumber: string;
  status: string;
  origin: string | null;
  destination: string | null;
};

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [mode, setMode] = useState('ocean');
  const [error, setError] = useState<string | null>(null);

  async function load(token: string) {
    const res = await apiFetch<{ data: Shipment[] }>('/shipments', { token });
    setShipments(res.data);
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
      await apiFetch('/shipments', {
        method: 'POST',
        token,
        body: JSON.stringify({ origin, destination, mode }),
      });
      setOrigin('');
      setDestination('');
      await load(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function book(id: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch(`/shipments/${id}/status`, {
      method: 'POST',
      token,
      body: JSON.stringify({ status: 'booked' }),
    });
    await load(token);
  }

  return (
    <section>
      <h1>Shipments</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul style={{ marginTop: 12 }}>
        {shipments.map((s) => (
          <li key={s.id} style={{ marginBottom: 8 }}>
            {s.trackingNumber} — {s.status}
            {s.origin ? ` — ${s.origin}` : ''}
            {s.destination ? ` → ${s.destination}` : ''}
            {s.status === 'draft' ? (
              <button type="button" style={{ marginLeft: 8 }} onClick={() => book(s.id)}>
                Mark booked
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginTop: 16, maxWidth: 360 }}>
        <input
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origin"
          required
          style={inputStyle}
        />
        <input
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destination"
          required
          style={inputStyle}
        />
        <input
          value={mode}
          onChange={(e) => setMode(e.target.value)}
          placeholder="Mode"
          style={inputStyle}
        />
        <button type="submit">Create shipment</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
