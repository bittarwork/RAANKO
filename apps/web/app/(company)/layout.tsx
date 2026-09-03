import Link from 'next/link';

export default function CompanyLayout({
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
        <strong>RAANKO Company</strong>
        <nav style={{ display: 'flex', gap: '0.85rem', fontSize: '0.9rem' }}>
          <Link href="/company">Home</Link>
          <Link href="/company/login">Login</Link>
          <Link href="/company/onboarding">Onboarding</Link>
          <Link href="/company/branches">Branches</Link>
          <Link href="/company/employees">Employees</Link>
          <Link href="/company/settings">Settings</Link>
          <Link href="/company/settings/domains">Domains</Link>
          <Link href="/company/settings/webhooks">Webhooks</Link>
          <Link href="/company/settings/email-sender">Email</Link>
          <Link href="/company/memberships">Memberships</Link>
          <Link href="/company/customers">Customers</Link>
          <Link href="/company/quotes">Quotes</Link>
          <Link href="/company/shipments">Shipments</Link>
          <Link href="/company/documents">Documents</Link>
          <Link href="/company/finance">Finance</Link>
          <Link href="/company/reports">Reports</Link>
          <Link href="/company/support">Support</Link>
          <Link href="/company/notifications">Notifications</Link>
        </nav>
      </header>
      <main style={{ padding: '1.25rem', maxWidth: 900, margin: '0 auto' }}>{children}</main>
    </div>
  );
}
