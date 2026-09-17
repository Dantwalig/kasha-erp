'use client';

import { useEffect, useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Lead {
  id: string; name: string; company?: string; email?: string; status: string;
}
interface Customer { id: string; name: string; email?: string; phone?: string; }
interface Opportunity {
  id: string; name: string; amount: string; stage: string; customer: Customer;
}

const LEAD_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-gray-100 text-gray-600',
  CONTACTED: 'bg-brand-50 text-brand-500',
  QUALIFIED: 'bg-kasha-yellow text-black',
  DISQUALIFIED: 'bg-red-100 text-kasha-pink',
  CONVERTED: 'bg-green-100 text-green-700',
};

const STAGES = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
const STAGE_COLORS: Record<string, string> = {
  PROSPECTING: 'border-gray-300',
  QUALIFICATION: 'border-brand-500',
  PROPOSAL: 'border-kasha-yellow',
  NEGOTIATION: 'border-kasha-pink',
  WON: 'border-green-500',
  LOST: 'border-gray-400',
};

export default function CrmPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('crm:write');

  const [tab, setTab] = useState<'leads' | 'customers' | 'pipeline'>('leads');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadEmail, setLeadEmail] = useState('');

  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');

  const [oppCustomer, setOppCustomer] = useState('');
  const [oppName, setOppName] = useState('');
  const [oppAmount, setOppAmount] = useState('');

  async function loadAll() {
    try {
      const [l, c, o] = await Promise.all([
        api.get('/crm/leads'),
        api.get('/crm/customers'),
        api.get('/crm/opportunities'),
      ]);
      setLeads(l);
      setCustomers(c);
      setOpportunities(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CRM data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateLead(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/crm/leads', { name: leadName, company: leadCompany || undefined, email: leadEmail || undefined });
      setLeadName('');
      setLeadCompany('');
      setLeadEmail('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create lead');
    }
  }

  async function handleLeadStatus(id: string, status: string) {
    try {
      await api.patch(`/crm/leads/${id}/status`, { status });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update lead');
    }
  }

  async function handleConvert(id: string) {
    try {
      await api.post(`/crm/leads/${id}/convert`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
    }
  }

  async function handleCreateCustomer(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/crm/customers', { name: custName, email: custEmail || undefined });
      setCustName('');
      setCustEmail('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    }
  }

  async function handleCreateOpportunity(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/crm/opportunities', {
        customerId: oppCustomer,
        name: oppName,
        amount: Number(oppAmount),
      });
      setOppCustomer('');
      setOppName('');
      setOppAmount('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create opportunity');
    }
  }

  async function handleStageChange(id: string, stage: string) {
    try {
      await api.patch(`/crm/opportunities/${id}/stage`, { stage });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update stage');
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">CRM</h1>
        <p className="mt-1 text-sm text-gray-500">Leads, customers, and the sales pipeline.</p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['leads', 'customers', 'pipeline'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t ? 'border-b-2 border-brand-500 text-brand-500' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'leads' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateLead} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input required placeholder="Contact name" value={leadName} onChange={(e) => setLeadName(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Company" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Email" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Add Lead</button>
              </form>
            )}
            <div className="space-y-3">
              {leads.length === 0 && <p className="text-sm text-gray-500">No leads yet.</p>}
              {leads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
                  <div>
                    <span className="text-sm font-semibold text-gray-800">{lead.name}</span>
                    {lead.company && <span className="ml-2 text-xs text-gray-400">{lead.company}</span>}
                    {lead.email && <span className="ml-2 text-xs text-gray-400">{lead.email}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${LEAD_STATUS_COLORS[lead.status]}`}>
                      {lead.status}
                    </span>
                    {canWrite && lead.status !== 'CONVERTED' && (
                      <>
                        <select
                          defaultValue=""
                          onChange={(e) => e.target.value && handleLeadStatus(lead.id, e.target.value)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="">Change status...</option>
                          {['NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED'].map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                        {lead.status === 'QUALIFIED' && (
                          <button
                            onClick={() => handleConvert(lead.id)}
                            className="rounded-md bg-kasha-yellow px-3 py-1 text-xs font-bold text-black hover:opacity-90"
                          >
                            Convert to Customer
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'customers' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateCustomer} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <input required placeholder="Customer name" value={custName} onChange={(e) => setCustName(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input placeholder="Email" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Add Customer</button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-6 text-gray-500">No customers yet.</td></tr>
                  ) : (
                    customers.map((c) => (
                      <tr key={c.id}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'pipeline' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form onSubmit={handleCreateOpportunity} className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4">
                <select required value={oppCustomer} onChange={(e) => setOppCustomer(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm">
                  <option value="">Customer...</option>
                  {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input required placeholder="Deal name" value={oppName} onChange={(e) => setOppName(e.target.value)} className="rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <input required type="number" min="0" step="0.01" placeholder="Amount" value={oppAmount} onChange={(e) => setOppAmount(e.target.value)} className="w-32 rounded-md border border-gray-300 px-3 py-2 text-sm" />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">Add Opportunity</button>
              </form>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {STAGES.map((stage) => (
                <div key={stage} className={`rounded-lg border-t-4 bg-white p-3 ${STAGE_COLORS[stage]}`}>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                    {stage} ({opportunities.filter((o) => o.stage === stage).length})
                  </p>
                  <div className="space-y-2">
                    {opportunities.filter((o) => o.stage === stage).map((o) => (
                      <div key={o.id} className="rounded-md border border-gray-100 bg-gray-50 p-2">
                        <p className="text-xs font-semibold text-gray-800">{o.name}</p>
                        <p className="text-xs text-gray-500">{o.customer.name}</p>
                        <p className="text-xs font-bold text-brand-500">${Number(o.amount).toFixed(2)}</p>
                        {canWrite && (
                          <select
                            value={o.stage}
                            onChange={(e) => handleStageChange(o.id, e.target.value)}
                            className="mt-1 w-full rounded border border-gray-200 px-1 py-0.5 text-xs"
                          >
                            {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
