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
  unitOfMeasure: string;
  sellPrice: string;
  reorderPoint: number;
  totalStock: number;
  belowReorderPoint: boolean;
  isActive: boolean;
}

export default function InventoryPage() {
  const { hasPermission } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [reorderPoint, setReorderPoint] = useState('0');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function loadProducts(q?: string) {
    setLoading(true);
    try {
      const data = await api.get(
        `/inventory/products${q ? `?search=${encodeURIComponent(q)}` : ''}`,
      );
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    loadProducts(search);
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await api.post('/inventory/products', {
        sku,
        name,
        sellPrice: sellPrice ? Number(sellPrice) : 0,
        costPrice: costPrice ? Number(costPrice) : 0,
        reorderPoint: reorderPoint ? Number(reorderPoint) : 0,
      });
      setSku('');
      setName('');
      setSellPrice('');
      setCostPrice('');
      setReorderPoint('0');
      setShowForm(false);
      loadProducts(search);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Inventory</h1>
            <p className="mt-1 text-sm text-gray-500">
              Products and stock levels across all locations.
            </p>
          </div>
          <Link
            href="/inventory/stock"
            className="rounded-md border border-brand-500 px-3 py-2 text-sm font-semibold text-brand-500 hover:bg-brand-50"
          >
            Transfers & Adjustments
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              type="submit"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Search
            </button>
          </form>

          {hasPermission('inventory:write') && (
            <button
              onClick={() => setShowForm((v) => !v)}
              className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600"
            >
              {showForm ? 'Cancel' : '+ New Product'}
            </button>
          )}
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mt-4 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-6 sm:grid-cols-3"
          >
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">SKU</label>
              <input
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-sm font-semibold text-gray-700">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Cost Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Sell Price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellPrice}
                onChange={(e) => setSellPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-gray-700">Reorder Point</label>
              <input
                type="number"
                min="0"
                value={reorderPoint}
                onChange={(e) => setReorderPoint(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            {formError && (
              <p className="col-span-full text-sm text-kasha-pink">{formError}</p>
            )}

            <div className="col-span-full">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white">
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading...</p>
          ) : error ? (
            <p className="p-6 text-sm text-kasha-pink">{error}</p>
          ) : products.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No products yet.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Sell Price</th>
                  <th className="px-4 py-3">Stock</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-600">
                      ${Number(p.sellPrice).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {p.totalStock} {p.unitOfMeasure}
                    </td>
                    <td className="px-4 py-3">
                      {!p.isActive ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-500">
                          inactive
                        </span>
                      ) : p.belowReorderPoint ? (
                        <span className="rounded-full bg-kasha-yellow px-2 py-0.5 text-xs font-bold text-black">
                          reorder
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-bold text-green-700">
                          in stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
