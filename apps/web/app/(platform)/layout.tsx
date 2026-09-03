import Link from 'next/link';

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: 'Georgia, serif', minHeight: '100vh', background: '#0f172a', color: '#e2e8f0' }}>
      <header
        style={{
          display: 'flex',
          gap: '1.5rem',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #334155',
        }}
      >
        <strong style={{ letterSpacing: '0.04em' }}>RAANKO Platform</strong>
        <nav style={{ display: 'flex', gap: '1rem', fontSize: '0.95rem' }}>
          <Link href="/platform/login" style={{ color: '#93c5fd' }}>
            Login
          </Link>
          <Link href="/platform/companies" style={{ color: '#93c5fd' }}>
            Companies
          </Link>
          <Link href="/platform/companies/new" style={{ color: '#93c5fd' }}>
            Create company
          </Link>
          <Link href="/platform/support" style={{ color: '#93c5fd' }}>
            Support tickets
          </Link>
        </nav>
      </header>
      <main style={{ padding: '1.5rem', maxWidth: 960, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
