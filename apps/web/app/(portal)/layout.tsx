import Link from 'next/link';

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
      <header
        style={{
          display: 'flex',
          gap: '1.25rem',
          alignItems: 'center',
          padding: '0.85rem 1.25rem',
          borderBottom: '1px solid #e2e8f0',
          background: 'white',
        }}
      >
        <strong>RAANKO Portal</strong>
        <nav style={{ display: 'flex', gap: '0.85rem', fontSize: '0.9rem' }}>
          <Link href="/portal">Home</Link>
          <Link href="/portal/login">Login</Link>
          <Link href="/portal/quotes">Quotes</Link>
          <Link href="/portal/shipments">Shipments</Link>
          <Link href="/portal/invoices">Invoices</Link>
          <Link href="/portal/documents">Documents</Link>
          <Link href="/portal/support">Support</Link>
          <Link href="/portal/rfq">RFQ</Link>
          <Link href="/track">Public tracking</Link>
        </nav>
      </header>
      <main style={{ padding: '1.25rem', maxWidth: 900, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
