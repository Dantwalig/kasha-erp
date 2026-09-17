'use client';

import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { api } from '@/lib/api';

interface Overview {
  inventory: { activeProducts: number; lowStockCount: number; totalStockValue: number };
  procurement: { openRequests: number; openOrders: number };
  warehouse: { openPickLists: number };
  finance: { arOutstanding: number; apOutstanding: number };
  crm: {
    openLeads: number;
    pipelineByStage: { stage: string; count: number; value: number }[];
    openPipelineValue: number;
  };
  hr: { activeEmployees: number; pendingLeave: number; openJobOpenings: number };
}

function KpiCard({ label, value, accent = 'brand' }: { label: string; value: string; accent?: 'brand' | 'yellow' | 'pink' }) {
  const accentClass =
    accent === 'yellow' ? 'text-black bg-kasha-yellow' : accent === 'pink' ? 'text-white bg-kasha-pink' : 'text-white bg-brand-500';
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 inline-block rounded-md px-2 py-1 text-lg font-extrabold ${accentClass}`}>{value}</p>
    </div>
  );
}

const STAGE_ORDER = ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export default function ReportingPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/reporting/overview')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load report data'));
  }, []);

  const chartData = data
    ? STAGE_ORDER.map((stage) => {
        const match = data.crm.pipelineByStage.find((s) => s.stage === stage);
        return { stage, value: match?.value ?? 0 };
      })
    : [];

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">Reporting &amp; Dashboards</h1>
        <p className="mt-1 text-sm text-gray-500">A live snapshot across every module.</p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        {!data && !error && <p className="mt-6 text-sm text-gray-500">Loading...</p>}

        {data && (
          <div className="mt-6 space-y-8">
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Inventory</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <KpiCard label="Active Products" value={String(data.inventory.activeProducts)} />
                <KpiCard label="Below Reorder Point" value={String(data.inventory.lowStockCount)} accent="yellow" />
                <KpiCard label="Total Stock Value" value={`$${data.inventory.totalStockValue.toFixed(2)}`} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Procurement &amp; Warehouse</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <KpiCard label="Open Requests" value={String(data.procurement.openRequests)} />
                <KpiCard label="Open Purchase Orders" value={String(data.procurement.openOrders)} />
                <KpiCard label="Open Pick Lists" value={String(data.warehouse.openPickLists)} />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Finance</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
                <KpiCard label="AR Outstanding" value={`$${data.finance.arOutstanding.toFixed(2)}`} accent="pink" />
                <KpiCard label="AP Outstanding" value={`$${data.finance.apOutstanding.toFixed(2)}`} accent="pink" />
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">Sales Pipeline</h2>
              <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-2">
                <KpiCard label="Open Leads" value={String(data.crm.openLeads)} />
                <KpiCard label="Open Pipeline Value" value={`$${data.crm.openPipelineValue.toFixed(2)}`} />
              </div>
              <div className="h-64 rounded-lg border border-gray-200 bg-white p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EEEEEE" />
                    <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => `$${v.toFixed(2)}`} />
                    <Bar dataKey="value" fill="#1E499F" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">HR</h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <KpiCard label="Active Employees" value={String(data.hr.activeEmployees)} />
                <KpiCard label="Pending Leave Requests" value={String(data.hr.pendingLeave)} accent="yellow" />
                <KpiCard label="Open Job Openings" value={String(data.hr.openJobOpenings)} />
              </div>
            </section>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
