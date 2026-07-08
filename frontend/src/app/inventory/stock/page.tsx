'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Product {
  id: string;
  sku: string;
  name: string;
}
interface Location {
  id: string;
  name: string;
  code: string;
}
interface StockLevel {
  productId: string;
  locationId: string;
  quantity: number;
  product: Product;
  location: Location;
}
interface Transfer {
  id: string;
  quantity: number;
  status: string;
  product: Product;
  fromLocation: Location;
  toLocation: Location;
  createdAt: string;
}

const REASONS = ['DAMAGE', 'LOSS', 'COUNT_CORRECTION', 'RETURN', 'OTHER'];

export default function StockPage() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [levels, setLevels] = useState<StockLevel[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [tab, setTab] = useState<'levels' | 'transfers' | 'adjust'>('levels');
  const [error, setError] = useState<string | null>(null);

  // New location quick-add (needed before any stock can exist anywhere)
  const [locName, setLocName] = useState('');
  const [locCode, setLocCode] = useState('');

  // Transfer form
  const [tProduct, setTProduct] = useState('');
  const [tFrom, setTFrom] = useState('');
  const [tTo, setTTo] = useState('');
  const [tQty, setTQty] = useState('1');

  // Adjustment form
  const [aProduct, setAProduct] = useState('');
  const [aLocation, setALocation] = useState('');
  const [aDelta, setADelta] = useState('0');
  const [aReason, setAReason] = useState('COUNT_CORRECTION');

  const [submitting, setSubmitting] = useState(false);

  async function loadAll() {
    try {
      const [p, l, s, t] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/locations'),
        api.get('/inventory/stock/levels'),
        api.get('/inventory/stock/transfers'),
      ]);
      setProducts(p);
      setLocations(l);
      setLevels(s);
      setTransfers(t);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stock data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateLocation(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/inventory/locations', { name: locName, code: locCode });
      setLocName('');
      setLocCode('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create location');
    }
  }

  async function handleTransfer(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.post('/inventory/stock/transfers', {
        productId: tProduct,
        fromLocationId: tFrom,
        toLocationId: tTo,
        quantity: Number(tQty),
      });
      // Immediately complete it for this simple flow - a fuller warehouse
      // workflow would let PENDING/IN_TRANSIT sit until picking/shipping is done.
      await api.post(`/inventory/stock/transfers/${created.id}/complete`);
      setTQty('1');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAdjustment(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post('/inventory/stock/adjustments', {
        productId: aProduct,
        locationId: aLocation,
        delta: Number(aDelta),
        reason: aReason,
      });
      setADelta('0');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Adjustment failed');
    } finally {
      setSubmitting(false);
    }
  }

  const canWrite = hasPermission('inventory:write');

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Link href="/inventory" className="text-sm text-brand-500 hover:underline">
          &larr; Back to Products
        </Link>
        <h1 className="mt-2 text-2xl font-extrabold text-gray-900">
          Stock: Transfers & Adjustments
        </h1>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">
            {error}
          </p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['levels', 'transfers', 'adjust'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'adjust' ? 'Adjustments' : t}
            </button>
          ))}
        </div>

        {tab === 'levels' && (
          <div className="mt-6">
            {locations.length === 0 && canWrite && (
              <form
                onSubmit={handleCreateLocation}
                className="mb-6 flex items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <p className="mr-2 text-sm text-gray-500">
                  No locations yet - add one to start tracking stock:
                </p>
                <input
                  required
                  placeholder="Name (e.g. Main Warehouse)"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Code (e.g. WH-01)"
                  value={locCode}
                  onChange={(e) => setLocCode(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button className="rounded-md bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-600">
                  Add
                </button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {levels.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-6 text-gray-500">
                        No stock recorded yet.
                      </td>
                    </tr>
                  ) : (
                    levels.map((l) => (
                      <tr key={`${l.productId}-${l.locationId}`}>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {l.product.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{l.location.name}</td>
                        <td className="px-4 py-3 text-gray-600">{l.quantity}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'transfers' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form
                onSubmit={handleTransfer}
                className="grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-4"
              >
                <select
                  required
                  value={tProduct}
                  onChange={(e) => setTProduct(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={tFrom}
                  onChange={(e) => setTFrom(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">From location...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <select
                  required
                  value={tTo}
                  onChange={(e) => setTTo(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">To location...</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  required
                  value={tQty}
                  onChange={(e) => setTQty(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  disabled={submitting}
                  className="col-span-full rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
                >
                  Transfer & Complete
                </button>
              </form>
            )}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">From</th>
                    <th className="px-4 py-3">To</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {transfers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-gray-500">
                        No transfers yet.
                      </td>
                    </tr>
                  ) : (
                    transfers.map((t) => (
                      <tr key={t.id}>
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {t.product.name}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{t.fromLocation.name}</td>
                        <td className="px-4 py-3 text-gray-600">{t.toLocation.name}</td>
                        <td className="px-4 py-3 text-gray-600">{t.quantity}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'adjust' && canWrite && (
          <form
            onSubmit={handleAdjustment}
            className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-4"
          >
            <select
              required
              value={aProduct}
              onChange={(e) => setAProduct(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              required
              value={aLocation}
              onChange={(e) => setALocation(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Location...</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              required
              placeholder="+/- quantity"
              value={aDelta}
              onChange={(e) => setADelta(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              value={aReason}
              onChange={(e) => setAReason(e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r.replace('_', ' ')}
                </option>
              ))}
            </select>
            <button
              disabled={submitting}
              className="col-span-full rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
            >
              Apply Adjustment
            </button>
          </form>
        )}
      </main>
    </ProtectedRoute>
  );
}
