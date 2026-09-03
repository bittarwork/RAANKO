'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch, COMPANY_TOKEN_KEY, getStoredToken } from '@/lib/api';

export default function EmailSenderSettingsPage() {
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    apiFetch<{
      data: { fromEmail: string; fromName: string; verified: boolean } | null;
    }>('/settings/email-sender', { token })
      .then((res) => {
        if (!res.data) return;
        setFromEmail(res.data.fromEmail);
        setFromName(res.data.fromName);
        setVerified(res.data.verified);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    setSaved(false);
    try {
      await apiFetch('/settings/email-sender', {
        method: 'PATCH',
        token,
        body: JSON.stringify({ fromEmail, fromName }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <p>
        <Link href="/company/settings">Back to settings</Link>
      </p>
      <h1>Email sender</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <p style={{ color: '#64748b' }}>
        Unverified senders fall back to the platform default From address.
      </p>
      <form onSubmit={onSave} style={{ display: 'grid', gap: 12, maxWidth: 400, marginTop: 16 }}>
        <label>
          From name
          <input value={fromName} onChange={(e) => setFromName(e.target.value)} style={inputStyle} />
        </label>
        <label>
          From email
          <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} style={inputStyle} />
        </label>
        <p>Verified: {verified ? 'yes' : 'no'}</p>
        <button type="submit">Save</button>
        {saved ? <p style={{ color: '#15803d' }}>Saved.</p> : null}
      </form>
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
