'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, getStoredToken, PLATFORM_TOKEN_KEY } from '@/lib/api';

const IMPERSONATION_KEY = 'raanko_impersonation_session';

type TenantDetail = {
  id: string;
  slug: string;
  displayName: string;
  status: string;
  writeMode: string;
};

export default function PlatformCompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{ data: TenantDetail }>(`/platform/tenants/${params.id}`, { token })
      .then((res) => setTenant(res.data))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, [params.id]);

  async function impersonate() {
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token || !params.id) return;
    try {
      const res = await apiFetch<{ data: { sessionId: string } }>(
        `/platform/tenants/${params.id}/impersonate`,
        {
          method: 'POST',
          token,
          body: JSON.stringify({ reason: 'platform_support' }),
        },
      );
      setSessionId(res.data.sessionId);
      window.sessionStorage.setItem(IMPERSONATION_KEY, res.data.sessionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <p>
        <Link href="/platform/companies" style={{ color: '#93c5fd' }}>
          Back to companies
        </Link>
      </p>
      <h1>{tenant?.displayName ?? 'Company'}</h1>
      {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
      {tenant ? (
        <p>
          {tenant.slug} — {tenant.status} / {tenant.writeMode}
        </p>
      ) : null}
      <button type="button" onClick={impersonate} style={{ marginTop: 16 }}>
        Start impersonation
      </button>
      {sessionId ? (
        <p style={{ marginTop: 12 }}>
          Impersonation session: <code>{sessionId}</code>
          <br />
          Company /auth/me accepts header X-Raanko-Impersonation with this id.
        </p>
      ) : null}
    </section>
  );
}
