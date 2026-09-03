'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  apiFetch,
  COMPANY_TOKEN_KEY,
  getStoredToken,
} from '@/lib/api';

type Employee = {
  id: string;
  status: string;
  user: { email: string; firstName: string | null; lastName: string | null };
  role: { id: string; name: string; key: string };
};

type Role = { id: string; name: string; key: string };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState('');
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) {
      setError('Not authenticated');
      return;
    }
    Promise.all([
      apiFetch<{ data: Employee[] }>('/organization/employees', { token }),
      apiFetch<{ data: Role[] }>('/organization/roles', { token }),
    ])
      .then(([emps, roleRes]) => {
        setEmployees(emps.data);
        setRoles(roleRes.data);
        if (roleRes.data[0]) setRoleId(roleRes.data[0].id);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed'));
  }, []);

  async function onInvite(e: FormEvent) {
    e.preventDefault();
    const token = getStoredToken(COMPANY_TOKEN_KEY);
    if (!token) return;
    try {
      const res = await apiFetch<{ data: { token: string } }>(
        '/organization/employees/invite',
        {
          method: 'POST',
          token,
          body: JSON.stringify({ email, roleId }),
        },
      );
      setInviteToken(res.data.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <section>
      <h1>Employees</h1>
      {error ? <p style={{ color: '#b91c1c' }}>{error}</p> : null}
      <ul style={{ marginTop: 12 }}>
        {employees.map((m) => (
          <li key={m.id}>
            {m.user.email} — {m.role.name} ({m.status})
          </li>
        ))}
      </ul>
      <form onSubmit={onInvite} style={{ display: 'grid', gap: 8, maxWidth: 360, marginTop: 16 }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          placeholder="Employee email"
          required
          style={{ padding: 8, border: '1px solid #cbd5e1', borderRadius: 6 }}
        />
        <select value={roleId} onChange={(e) => setRoleId(e.target.value)} style={{ padding: 8 }}>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        <button type="submit">Invite employee</button>
      </form>
      {inviteToken ? (
        <p style={{ marginTop: 12 }}>
          Invite token: <code>{inviteToken}</code>
        </p>
      ) : null}
    </section>
  );
}
