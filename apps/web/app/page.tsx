import { APP_NAME, API_VERSION } from '@raanko/shared';
import Link from 'next/link';

async function getHealth() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  try {
    const res = await fetch(`${apiUrl}/api/${API_VERSION}/health`, {
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const health = await getHealth();

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Georgia, serif',
        gap: '1rem',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        color: '#e2e8f0',
      }}
    >
      <h1>{APP_NAME}</h1>
      <p>Multi-tenant logistics platform — auth and organization slices.</p>
      <nav style={{ display: 'flex', gap: '1.25rem' }}>
        <Link href="/platform/login" style={{ color: '#93c5fd' }}>
          Platform login
        </Link>
        <Link href="/company/login" style={{ color: '#93c5fd' }}>
          Company login
        </Link>
        <Link href="/portal/login" style={{ color: '#93c5fd' }}>
          Portal login
        </Link>
        <Link href="/track" style={{ color: '#93c5fd' }}>
          Track shipment
        </Link>
      </nav>
      <section
        style={{
          padding: '1rem 1.5rem',
          border: '1px solid #334155',
          borderRadius: '8px',
          minWidth: '280px',
        }}
      >
        <strong>API health</strong>
        <pre style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
          {health ? JSON.stringify(health, null, 2) : 'API unreachable — start apps/api'}
        </pre>
      </section>
    </main>
  );
}
