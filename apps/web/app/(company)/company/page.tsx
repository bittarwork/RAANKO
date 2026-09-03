'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

export default function CompanyHomePage() {
  const [name, setName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [impersonationBanner, setImpersonationBanner] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Sign in to open the company workspace.');
      return;
    }
    const impersonation =
      typeof window !== 'undefined'
        ? window.sessionStorage.getItem('raanko_impersonation_session')
        : null;
    apiFetch<{
      data: {
        tenant?: { displayName: string };
        impersonation?: { active?: boolean; banner?: string };
      };
    }>('/auth/me', {
      token,
      headers: impersonation
        ? { 'X-Raanko-Impersonation': impersonation }
        : undefined,
    })
      .then((res) => {
        setName(res.data.tenant?.displayName ?? 'Company');
        if (res.data.impersonation?.active) {
          setImpersonationBanner(
            res.data.impersonation.banner ?? 'Platform impersonation is active',
          );
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  return (
    <section>
      <h1>{name ?? 'Company workspace'}</h1>
      {impersonationBanner ? (
        <p style={{ background: '#fef3c7', padding: 12, borderRadius: 6 }}>
          {impersonationBanner}
        </p>
      ) : null}
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <p style={{ marginTop: 8, color: '#64748b' }}>
        Organization shell for onboarding, branches, employees, and settings.
      </p>
      <ul style={{ marginTop: 16, lineHeight: 1.8 }}>
        <li>
          <Link href="/company/onboarding">Onboarding</Link>
        </li>
        <li>
          <Link href="/company/branches">Branches</Link>
        </li>
        <li>
          <Link href="/company/employees">Employees</Link>
        </li>
        <li>
          <Link href="/company/settings">Settings</Link>
        </li>
        <li>
          <Link href="/company/settings/domains">Custom domains</Link>
        </li>
        <li>
          <Link href="/company/settings/email-sender">Email sender</Link>
        </li>
        <li>
          <Link href="/company/settings/webhooks">Webhooks</Link>
        </li>
        <li>
          <Link href="/company/memberships">Memberships</Link>
        </li>
        <li>
          <Link href="/company/customers">Customers</Link>
        </li>
        <li>
          <Link href="/company/quotes">Quotes</Link>
        </li>
        <li>
          <Link href="/company/shipments">Shipments</Link>
        </li>
      </ul>
    </section>
  );
}
