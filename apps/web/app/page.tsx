import { APP_NAME, API_VERSION } from '@raanko/shared';

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
        fontFamily: 'system-ui, sans-serif',
        gap: '1rem',
      }}
    >
      <h1>{APP_NAME}</h1>
      <p>Slice 1 scaffold — monorepo is running.</p>
      <section
        style={{
          padding: '1rem 1.5rem',
          border: '1px solid #ddd',
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
