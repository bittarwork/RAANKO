'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, PORTAL_TOKEN_KEY, getStoredToken } from '@/lib/api';

export default function PortalHomePage() {
  const [home, setHome] = useState<{ writeMode?: string; canSubmitRfq?: boolean; tenantName?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PORTAL_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: { writeMode?: string; canSubmitRfq?: boolean; tenantName?: string } }>('/portal/home', { token })
      .then((res) => setHome(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <h1>Portal home</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {home ? <p>{home.tenantName} — write mode {home.writeMode}</p> : null}
      {home?.canSubmitRfq ? <Link href="/portal/rfq">Request a quote</Link> : <p>RFQ is disabled while the company is read-only.</p>}
    </section>
  );
}
