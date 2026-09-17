'use client';

import { useEffect, useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Payment { id: string; amount: string; method: string; createdAt: string; }
interface Invoice {
  id: string; customerName: string; amount: string; status: string;
  dueDate?: string; payments: Payment[];
}
interface Supplier { id: string; name: string; }
interface Bill {
  id: string; supplier: Supplier; amount: string; status: string;
  dueDate?: string; payments: Payment[];
}
interface Account { id: string; code: string; name: string; type: string; }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-brand-50 text-brand-500',
  APPROVED: 'bg-brand-50 text-brand-500',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-kasha-pink',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

function paidTotal(payments: Payment[]) {
  return payments.reduce((sum, p) => sum + Number(p.amount), 0);
}

const ACCOUNT_TYPES = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

export default function FinancePage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('finance:write');

  const [tab, setTab] = useState<'invoices' | 'bills' | 'accounts'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [invCustomer, setInvCustomer] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDue, setInvDue] = useState('');

  const [billSupplier, setBillSupplier] = useState('');
  const [billAmount, setBillAmount] = useState('');
  const [billDue, setBillDue] = useState('');

  const [acctCode, setAcctCode] = useState('');
  const [acctName, setAcctName] = useState('');
  const [acctType, setAcctType] = useState('ASSET');

  const [payAmount, setPayAmount] = useState<Record<string, string>>({});

  async function loadAll() {
    try {
      const [i, b, s, a] = await Promise.all([
        api.get('/finance/invoices'),
        api.get('/finance/bills'),
        api.get('/procurement/suppliers'),
        api.get('/finance/accounts'),
      ]);
      setInvoices(i);
      setBills(b);
      setSuppliers(s);
      setAccounts(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load finance data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateInvoice(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/finance/invoices', {
        customerName: invCustomer,
        amount: Number(invAmount),
        dueDate: invDue || undefined,
      });
      setInvCustomer('');
      setInvAmount('');
      setInvDue('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
    }
  }

  async function handleCreateBill(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/finance/bills', {
        supplierId: billSupplier,
        amount: Number(billAmount),
        dueDate: billDue || undefined,
      });
      setBillSupplier('');
      setBillAmount('');
      setBillDue('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create bill');
    }
  }

  async function handleCreateAccount(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/finance/accounts', { code: acctCode, name: acctName, type: acctType });
      setAcctCode('');
      setAcctName('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    }
  }

  async function handlePayInvoice(id: string) {
    const amount = payAmount[id];
    if (!amount) return setError('Enter a payment amount');
    try {
      await api.post(`/finance/invoices/${id}/payments`, { amount: Number(amount) });
      setPayAmount((s) => ({ ...s, [id]: '' }));
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  async function handlePayBill(id: string) {
    const amount = payAmount[id];
    if (!amount) return setError('Enter a payment amount');
    try {
      await api.post(`/finance/bills/${id}/payments`, { amount: Number(amount) });
      setPayAmount((s) => ({ ...s, [id]: '' }));
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">Finance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Invoices (AR), Bills (AP), and the Chart of Accounts.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['invoices', 'bills', 'accounts'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'accounts' ? 'Chart of Accounts' : t}
            </button>
          ))}
        </div>

        {tab === 'invoices' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateInvoice} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input required placeholder="Customer name" value={invCustomer} onChange={(e) => setInvCustomer(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0.01" step="0.01" placeholder="Amount" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" value={invDue} onChange={(e) => setInvDue(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Create Invoice</button>
              </form>
            )}

            <div className="space-y-3">
              {invoices.length === 0 && <p className="text-sm text-gray-500">No invoices yet.</p>}
              {invoices.map((inv) => {
                const paid = paidTotal(inv.payments);
                const remaining = Number(inv.amount) - paid;
                return (
                  <div key={inv.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{inv.customerName}</span>
                      <StatusBadge status={inv.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      ${Number(inv.amount).toFixed(2)} total — ${paid.toFixed(2)} paid
                      {remaining > 0 && ` — $${remaining.toFixed(2)} remaining`}
                    </p>
                    {canWrite && inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Payment amount"
                          value={payAmount[inv.id] ?? ''}
                          onChange={(e) => setPayAmount((s) => ({ ...s, [inv.id]: e.target.value }))}
                          className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs"
                        />
                        <button onClick={() => handlePayInvoice(inv.id)} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600">
                          Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'bills' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateBill} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <select required value={billSupplier} onChange={(e) => setBillSupplier(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Supplier...</option>
                  {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <input required type="number" min="0.01" step="0.01" placeholder="Amount" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input type="date" value={billDue} onChange={(e) => setBillDue(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Create Bill</button>
              </form>
            )}

            <div className="space-y-3">
              {bills.length === 0 && <p className="text-sm text-gray-500">No bills yet.</p>}
              {bills.map((bill) => {
                const paid = paidTotal(bill.payments);
                const remaining = Number(bill.amount) - paid;
                return (
                  <div key={bill.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{bill.supplier.name}</span>
                      <StatusBadge status={bill.status} />
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      ${Number(bill.amount).toFixed(2)} total — ${paid.toFixed(2)} paid
                      {remaining > 0 && ` — $${remaining.toFixed(2)} remaining`}
                    </p>
                    {canWrite && bill.status !== 'PAID' && bill.status !== 'CANCELLED' && (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Payment amount"
                          value={payAmount[bill.id] ?? ''}
                          onChange={(e) => setPayAmount((s) => ({ ...s, [bill.id]: e.target.value }))}
                          className="w-32 rounded-md border border-gray-300 px-2 py-1 text-xs"
                        />
                        <button onClick={() => handlePayBill(bill.id)} className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600">
                          Record Payment
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'accounts' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateAccount} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input required placeholder="Code (e.g. 1000)" value={acctCode} onChange={(e) => setAcctCode(e.target.value)} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required placeholder="Name (e.g. Cash)" value={acctName} onChange={(e) => setAcctName(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <select value={acctType} onChange={(e) => setAcctType(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  {ACCOUNT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Add Account</button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {accounts.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-gray-500">No accounts yet.</td></tr>
                  ) : (
                    accounts.map((a) => (
                      <tr key={a.id}>
                        <td className="px-4 py-3 font-mono text-xs text-gray-600">{a.code}</td>
                        <td className="px-4 py-3 font-semibold text-gray-800">{a.name}</td>
                        <td className="px-4 py-3 text-gray-600">{a.type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
