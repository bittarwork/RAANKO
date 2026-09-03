'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  apiFetch,
  getStoredToken,
  PLATFORM_TOKEN_KEY,
} from '@/lib/api';

export default function CreateCompanyPage() {
  const router = useRouter();
  const [legalName, setLegalName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(PLATFORM_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<{
        data: { invitation: { token: string } };
      }>('/platform/tenants', {
        method: 'POST',
        token,
        body: JSON.stringify({
          legalName,
          displayName,
          slug,
          ownerEmail,
          defaultCurrency: 'EUR',
        }),
      });
      setInviteToken(res.data.invitation.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section>
      <h1 style={{ fontSize: '1.75rem', marginBottom: '1rem' }}>Create company</h1>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: '0.75rem', maxWidth: 420 }}>
        <Field label="Legal name" value={legalName} onChange={setLegalName} required />
        <Field label="Display name" value={displayName} onChange={setDisplayName} required />
        <Field label="Slug" value={slug} onChange={setSlug} required />
        <Field label="Owner email" value={ownerEmail} onChange={setOwnerEmail} type="email" required />
        {error ? <p style={{ color: '#fca5a5' }}>{error}</p> : null}
        {inviteToken ? (
          <div style={{ background: '#14532d', padding: '0.75rem', borderRadius: 6 }}>
            <p>Company provisioned. Owner invite token (local MVP):</p>
            <code style={{ wordBreak: 'break-all' }}>{inviteToken}</code>
            <p style={{ marginTop: '0.5rem' }}>
              Accept at <a href={`/invite/accept?token=${inviteToken}`} style={{ color: '#86efac' }}>/invite/accept</a>
            </p>
            <button type="button" onClick={() => router.push('/platform/companies')} style={{ marginTop: 8 }}>
              Back to list
            </button>
          </div>
        ) : (
          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? 'Provisioning…' : 'Provision tenant'}
          </button>
        )}
      </form>
    </section>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label>
      {props.label}
      <input
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        type={props.type ?? 'text'}
        required={props.required}
        style={{
          display: 'block',
          width: '100%',
          marginTop: 4,
          padding: '0.5rem 0.65rem',
          borderRadius: 6,
          border: '1px solid #475569',
          background: '#1e293b',
          color: '#f8fafc',
        }}
      />
    </label>
  );
}

const buttonStyle: React.CSSProperties = {
  padding: '0.65rem 1rem',
  borderRadius: 6,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 600,
};
