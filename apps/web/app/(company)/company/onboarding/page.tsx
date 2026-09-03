'use client';

import { useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

export default function OnboardingPage() {
  const [step, setStep] = useState('welcome');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setMessage('Sign in to continue onboarding.');
      return;
    }
    apiFetch<{ data: { onboardingStep: string } }>('/organization/settings', {
      token,
    })
      .then((res) => setStep(res.data.onboardingStep))
      .catch((err) => setMessage(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function advance(next: string) {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await apiFetch('/organization/settings', {
      method: 'PATCH',
      token,
      body: JSON.stringify({ onboardingStep: next }),
    });
    setStep(next);
  }

  return (
    <section>
      <h1>Onboarding</h1>
      <p style={{ color: '#64748b' }}>MVP wizard stub — progress is saved on the tenant.</p>
      {message ? <p style={{ color: '#b91c1c' }}>{message}</p> : null}
      <div style={{ marginTop: 16, padding: 16, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8 }}>
        <p>
          Current step: <strong>{step}</strong>
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button type="button" onClick={() => advance('profile')} style={btn}>
            Profile
          </button>
          <button type="button" onClick={() => advance('branches')} style={btn}>
            Branches
          </button>
          <button type="button" onClick={() => advance('team')} style={btn}>
            Team
          </button>
          <button type="button" onClick={() => advance('completed')} style={btn}>
            Complete
          </button>
        </div>
      </div>
    </section>
  );
}

const btn: React.CSSProperties = {
  padding: '0.45rem 0.75rem',
  borderRadius: 6,
  border: '1px solid #cbd5e1',
  background: '#f1f5f9',
  cursor: 'pointer',
};
