'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

export default function SettingsPage() {
  const [displayName, setDisplayName] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f766e');
  const [logoUrl, setLogoUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{
      data: {
        displayName: string;
        primaryColor: string | null;
        logoUrl: string | null;
      };
    }>('/organization/settings', { token })
      .then((res) => {
        setDisplayName(res.data.displayName);
        setPrimaryColor(res.data.primaryColor ?? '#0f766e');
        setLogoUrl(res.data.logoUrl ?? '');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    setSaved(false);
    try {
      await apiFetch('/organization/settings', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ displayName, primaryColor, logoUrl: logoUrl || null }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <h1>Company settings</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <form onSubmit={onSave} style={{ display: 'grid', gap: 12, maxWidth: 400, marginTop: 16 }}>
        <label>
          Display name
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={inputStyle} />
        </label>
        <label>
          Primary color
          <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={inputStyle} />
        </label>
        <label>
          Logo URL
          <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={inputStyle} />
        </label>
        <button type="submit">Save</button>
        {saved ? <p style={{ color: '#15803d' }}>Saved.</p> : null}
      </form>
      <ul style={{ marginTop: 24, lineHeight: 1.8 }}>
        <li>
          <Link href="/company/settings/domains">Custom domains</Link>
        </li>
        <li>
          <Link href="/company/settings/email-sender">Email sender</Link>
        </li>
        <li>
          <Link href="/company/settings/webhooks">Webhooks</Link>
        </li>
      </ul>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  marginTop: 4,
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
