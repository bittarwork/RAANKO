'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

type Customer = {
  id: string;
  legalName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [legalName, setLegalName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [search, setSearch] = useState('');
  const [warning, setWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load(token: string, q?: string) {
    const query = q ? `?search=${encodeURIComponent(q)}` : '';
    const res = await apiFetch<{ data: Customer[] }>(`/crm/customers${query}`, {
      token,
    });
    setCustomers(res.data);
  }

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    load(token).catch((err) =>
      setError(err instanceof Error ? err.message : 'Failed'),
    );
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      const res = await apiFetch<{ meta?: { warnings?: string[] } }>(
        '/crm/customers',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ legalName, email: email || undefined, phone: phone || undefined }),
        },
      );
      setLegalName('');
      setEmail('');
      setPhone('');
      setWarning(res.meta?.warnings?.join(', ') ?? null);
      await load(token, search);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    await load(token, search);
  }

  return (
    <section>
      <h1>Customers</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      {warning ? <p style={{ color: '#b45309' }}>{warning}</p> : null}
      <form onSubmit={onSearch} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          style={inputStyle}
        />
        <button type="submit">Search</button>
      </form>
      <ul style={{ marginTop: 12 }}>
        {customers.map((c) => (
          <li key={c.id}>
            {c.displayName} {c.email ? `— ${c.email}` : ''} {c.phone ? `— ${c.phone}` : ''}
          </li>
        ))}
      </ul>
      <form onSubmit={onCreate} style={{ display: 'grid', gap: 8, marginTop: 16, maxWidth: 360 }}>
        <input
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          placeholder="Legal name"
          required
          style={inputStyle}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          style={inputStyle}
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          style={inputStyle}
        />
        <button type="submit">Add customer</button>
      </form>
    </section>
  );
}

const inputStyle: React.CSSProperties = {
  padding: 8,
  border: '1px solid #cbd5e1',
  borderRadius: 6,
};
