'use client';

import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';

const MODULES = [
  { name: 'Auth & RBAC', status: 'live', href: null },
  { name: 'Inventory', status: 'live', href: '/inventory' },
  { name: 'Procurement', status: 'next', href: null },
  { name: 'Warehouse Management', status: 'planned', href: null },
  { name: 'Finance', status: 'planned', href: null },
  { name: 'CRM', status: 'planned', href: null },
  { name: 'HR', status: 'planned', href: null },
  { name: 'Reporting & Dashboards', status: 'planned', href: null },
];

const STATUS_STYLES: Record<string, string> = {
  live: 'bg-green-100 text-green-700',
  next: 'bg-kasha-yellow text-black',
  planned: 'bg-gray-100 text-gray-500',
};

export default function DashboardPage() {
  const { user, hasPermission } = useAuth();

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">
          Welcome{user?.firstName ? `, ${user.firstName}` : ''}
        </h1>
        <p className="mt-1 text-gray-500">
          You're signed in with {user?.roles.length ? user.roles.join(', ') : 'no'} role
          {user?.roles.length === 1 ? '' : 's'}.
        </p>

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">
            Module Roadmap
          </h2>
          <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {MODULES.map((m) => (
              <li
                key={m.name}
                className="flex items-center justify-between px-4 py-3"
              >
                {m.href ? (
                  <Link
                    href={m.href}
                    className="text-sm font-semibold text-brand-500 hover:underline"
                  >
                    {m.name}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-gray-800">{m.name}</span>
                )}
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLES[m.status]}`}
                >
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {hasPermission('users:read') && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">
              Your Permissions
            </h2>
            <div className="flex flex-wrap gap-2">
              {user?.permissions.map((p) => (
                <span
                  key={p}
                  className="rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600"
                >
                  {p}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
    </ProtectedRoute>
  );
}
