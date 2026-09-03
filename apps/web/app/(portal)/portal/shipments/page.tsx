'use client';

import { useEffect, useState } from 'react';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

type Shipment = { trackingNumber: string; status: string; origin: string | null; destination: string | null };

export default function PortalShipmentsPage() {
  const [rows, setRows] = useState<Shipment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: Shipment[] }>('/portal/shipments', { token })
      .then((res) => setRows(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <h1>Shipments</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul>
        {rows.map((s) => (
          <li key={s.trackingNumber}>
            {s.trackingNumber} — {s.status}
            {s.origin ? ` — ${s.origin}` : ''}
            {s.destination ? ` → ${s.destination}` : ''}
          </li>
        ))}
      </ul>
    </section>
  );
}
