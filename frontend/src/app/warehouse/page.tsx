'use client';

import { useEffect, useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Product { id: string; sku: string; name: string; }
interface Location { id: string; name: string; }
interface PickItem {
  id: string;
  productId: string;
  quantityRequested: number;
  quantityPicked: number;
  product: Product;
}
interface PickList {
  id: string;
  destination: string;
  status: string;
  trackingNumber?: string;
  location: Location;
  items: PickItem[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  PICKING: 'bg-kasha-yellow text-black',
  PACKED: 'bg-brand-50 text-brand-500',
  SHIPPED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
}

export default function WarehousePage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('warehouse:write');

  const [tab, setTab] = useState<'pick-lists' | 'scan'>('pick-lists');
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [plLocation, setPlLocation] = useState('');
  const [plDestination, setPlDestination] = useState('');
  const [plItems, setPlItems] = useState([{ productId: '', quantity: 1 }]);
  const [pickQty, setPickQty] = useState<Record<string, string>>({});

  const [scanCode, setScanCode] = useState('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  async function loadAll() {
    try {
      const [p, l, pl] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/locations'),
        api.get('/warehouse/pick-lists'),
      ]);
      setProducts(p);
      setLocations(l);
      setPickLists(pl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load warehouse data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/warehouse/pick-lists', {
        locationId: plLocation,
        destination: plDestination,
        items: plItems
          .filter((i) => i.productId)
          .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setPlLocation('');
      setPlDestination('');
      setPlItems([{ productId: '', quantity: 1 }]);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pick list');
    }
  }

  async function handlePick(pickListId: string, itemId: string) {
    const qty = pickQty[itemId];
    if (!qty) {
      setError('Enter a quantity to pick');
      return;
    }
    try {
      await api.post(`/warehouse/pick-lists/${pickListId}/pick`, {
        itemId,
        quantity: Number(qty),
      });
      setPickQty((s) => ({ ...s, [itemId]: '' }));
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Picking failed');
    }
  }

  async function handlePack(id: string) {
    try {
      await api.patch(`/warehouse/pick-lists/${id}/pack`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Packing failed');
    }
  }

  async function handleShip(id: string) {
    const trackingNumber = prompt('Tracking number (optional)') ?? undefined;
    try {
      await api.patch(`/warehouse/pick-lists/${id}/ship`, { trackingNumber });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Shipping failed');
    }
  }

  async function handleScan(e: FormEvent) {
    e.preventDefault();
    setScanError(null);
    setScanResult(null);
    try {
      const result = await api.get(`/warehouse/scan?code=${encodeURIComponent(scanCode)}`);
      setScanResult(result);
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Lookup failed');
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">Warehouse Management</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pick, pack, and ship outbound orders. Receiving happens via Procurement.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['pick-lists', 'scan'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'pick-lists' ? 'Pick Lists' : 'Scan Lookup'}
            </button>
          ))}
        </div>

        {tab === 'pick-lists' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form
                onSubmit={handleCreate}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">
                  New Pick List
                </p>
                <div className="mb-3 grid grid-cols-2 gap-3">
                  <select
                    required
                    value={plLocation}
                    onChange={(e) => setPlLocation(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="">From location...</option>
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <input
                    required
                    placeholder="Destination (customer, store, etc.)"
                    value={plDestination}
                    onChange={(e) => setPlDestination(e.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                {plItems.map((item, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const next = [...plItems];
                        next[idx].productId = e.target.value;
                        setPlItems(next);
                      }}
                      className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Product...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const next = [...plItems];
                        next[idx].quantity = Number(e.target.value);
                        setPlItems(next);
                      }}
                      className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    {plItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setPlItems(plItems.filter((_, i) => i !== idx))}
                        className="px-2 text-sm text-kasha-pink"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setPlItems([...plItems, { productId: '', quantity: 1 }])}
                  className="mb-3 text-sm font-semibold text-brand-500 hover:underline"
                >
                  + Add another item
                </button>
                <div>
                  <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
                    Create Pick List
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {pickLists.length === 0 && (
                <p className="text-sm text-gray-500">No pick lists yet.</p>
              )}
              {pickLists.map((pl) => {
                const fullyPicked = pl.items.every((i) => i.quantityPicked >= i.quantityRequested);
                return (
                  <div key={pl.id} className="rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-semibold text-gray-800">{pl.destination}</span>
                        <span className="ml-2 text-xs text-gray-400">from {pl.location.name}</span>
                      </div>
                      <StatusBadge status={pl.status} />
                    </div>

                    <ul className="mt-2 space-y-2 text-sm text-gray-600">
                      {pl.items.map((i) => {
                        const remaining = i.quantityRequested - i.quantityPicked;
                        return (
                          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
                            <span>
                              {i.product.name} — {i.quantityPicked}/{i.quantityRequested} picked
                            </span>
                            {remaining > 0 && canWrite && pl.status !== 'CANCELLED' && pl.status !== 'SHIPPED' && (
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min="1"
                                  max={remaining}
                                  placeholder="qty"
                                  value={pickQty[i.id] ?? ''}
                                  onChange={(e) => setPickQty((s) => ({ ...s, [i.id]: e.target.value }))}
                                  className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs"
                                />
                                <button
                                  onClick={() => handlePick(pl.id, i.id)}
                                  className="rounded-md bg-brand-500 px-2 py-1 text-xs font-bold text-white hover:bg-brand-600"
                                >
                                  Pick
                                </button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>

                    {canWrite && (
                      <div className="mt-3 flex gap-2">
                        {pl.status === 'PICKING' && fullyPicked && (
                          <button
                            onClick={() => handlePack(pl.id)}
                            className="rounded-md bg-kasha-yellow px-3 py-1.5 text-xs font-bold text-black hover:opacity-90"
                          >
                            Mark Packed
                          </button>
                        )}
                        {pl.status === 'PACKED' && (
                          <button
                            onClick={() => handleShip(pl.id)}
                            className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
                          >
                            Ship
                          </button>
                        )}
                      </div>
                    )}
                    {pl.trackingNumber && (
                      <p className="mt-2 text-xs text-gray-400">Tracking: {pl.trackingNumber}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'scan' && (
          <div className="mt-6">
            <form onSubmit={handleScan} className="flex gap-2">
              <input
                autoFocus
                value={scanCode}
                onChange={(e) => setScanCode(e.target.value)}
                placeholder="Scan or type a barcode / SKU..."
                className="w-80 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
                Look up
              </button>
            </form>
            <p className="mt-1 text-xs text-gray-400">
              A connected barcode/QR scanner types the code and hits Enter automatically - this field works the same way.
            </p>

            {scanError && (
              <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{scanError}</p>
            )}

            {scanResult && (
              <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
                <p className="text-lg font-extrabold text-gray-900">{scanResult.name}</p>
                <p className="font-mono text-xs text-gray-500">SKU: {scanResult.sku}{scanResult.barcode ? ` · Barcode: ${scanResult.barcode}` : ''}</p>
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-500">
                    Stock by Location
                  </p>
                  {scanResult.stockItems?.length ? (
                    <ul className="space-y-1 text-sm text-gray-600">
                      {scanResult.stockItems.map((si: any) => (
                        <li key={si.locationId}>{si.location.name}: {si.quantity}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No stock recorded anywhere yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
}
