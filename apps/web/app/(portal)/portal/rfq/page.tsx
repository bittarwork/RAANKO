'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  PORTAL_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

export default function PortalRfqPage() {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [cargoDescription, setCargoDescription] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canSubmit, setCanSubmit] = useState(true);

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) return;
    apiFetch<{ data: { canSubmitRfq?: boolean } }>('/portal/home', { token })
      .then((res) => setCanSubmit(res.data.canSubmitRfq !== false))
      .catch(() => undefined);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Sign in to the portal first.');
      return;
    }
    try {
      await apiFetch('/portal/rfq', {
        method: 'POST',
        token,
        body: JSON.stringify({ origin, destination, cargoDescription, mode: 'ocean' }),
      });
      setMessage('RFQ submitted.');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <h1>Request a quote</h1>
      {!canSubmit ? <p>RFQ submit is disabled because this company is read-only.</p> : null}
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Origin" required style={inputStyle} disabled={!canSubmit} />
        <input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Destination" required style={inputStyle} disabled={!canSubmit} />
        <textarea
          value={cargoDescription}
          onChange={(e) => setCargoDescription(e.target.value)}
          placeholder="Cargo description"
          disabled={!canSubmit}
          style={{ ...inputStyle, minHeight: 80 }}
        />
        {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
        {message ? <p style={{ color: '#047857' }}>{message}</p> : null}
        {canSubmit ? <button type="submit">Submit RFQ</button> : null}
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: '0.5rem',
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
