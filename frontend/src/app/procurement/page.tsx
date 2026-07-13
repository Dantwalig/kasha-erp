'use client';

import { useEffect, useState, FormEvent } from 'react';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';

interface Product { id: string; sku: string; name: string; }
interface Location { id: string; name: string; }
interface Supplier { id: string; name: string; email?: string; phone?: string; }
interface RequestItem { id: string; productId: string; quantity: number; product: Product; }
interface PurchaseRequest {
  id: string;
  status: string;
  notes?: string;
  rejectionReason?: string;
  requestedBy: { email: string; firstName?: string };
  items: RequestItem[];
  createdAt: string;
}
interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: string;
  product: Product;
}
interface PurchaseOrder {
  id: string;
  status: string;
  supplier: Supplier;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SUBMITTED: 'bg-kasha-yellow text-black',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-kasha-pink',
  SENT: 'bg-brand-50 text-brand-500',
  PARTIALLY_RECEIVED: 'bg-kasha-yellow text-black',
  RECEIVED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ProcurementPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission('procurement:write');
  const canApprove = hasPermission('procurement:approve');
  const canReceive = hasPermission('inventory:write');

  const [tab, setTab] = useState<'requests' | 'orders' | 'suppliers'>('requests');
  const [products, setProducts] = useState<Product[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [requests, setRequests] = useState<PurchaseRequest[]>([]);
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  // New request form
  const [reqItems, setReqItems] = useState([{ productId: '', quantity: 1 }]);
  const [reqNotes, setReqNotes] = useState('');

  // Convert-to-PO inline state: requestId -> chosen supplierId
  const [convertSupplier, setConvertSupplier] = useState<Record<string, string>>({});

  // New supplier form
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');

  // Receive form state: itemId -> { quantity, locationId }
  const [receiveState, setReceiveState] = useState<Record<string, { quantity: string; locationId: string }>>({});

  async function loadAll() {
    try {
      const [p, l, s, r, o] = await Promise.all([
        api.get('/inventory/products'),
        api.get('/inventory/locations'),
        api.get('/procurement/suppliers'),
        api.get('/procurement/requests'),
        api.get('/procurement/orders'),
      ]);
      setProducts(p);
      setLocations(l);
      setSuppliers(s);
      setRequests(r);
      setOrders(o);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load procurement data');
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateRequest(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/procurement/requests', {
        notes: reqNotes || undefined,
        items: reqItems
          .filter((i) => i.productId)
          .map((i) => ({ productId: i.productId, quantity: Number(i.quantity) })),
      });
      setReqItems([{ productId: '', quantity: 1 }]);
      setReqNotes('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create request');
    }
  }

  async function handleApprove(id: string) {
    try {
      await api.patch(`/procurement/requests/${id}/approve`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed');
    }
  }

  async function handleReject(id: string) {
    const reason = prompt('Reason for rejection?') ?? 'Not specified';
    try {
      await api.patch(`/procurement/requests/${id}/reject`, { reason });
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rejection failed');
    }
  }

  async function handleConvert(requestId: string) {
    const supplierId = convertSupplier[requestId];
    if (!supplierId) {
      setError('Choose a supplier first');
      return;
    }
    try {
      await api.post(`/procurement/orders/from-request/${requestId}`, { supplierId });
      loadAll();
      setTab('orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion to PO failed');
    }
  }

  async function handleCreateSupplier(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/procurement/suppliers', { name: supName, email: supEmail || undefined });
      setSupName('');
      setSupEmail('');
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create supplier');
    }
  }

  async function handleSend(id: string) {
    try {
      await api.patch(`/procurement/orders/${id}/send`);
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send order');
    }
  }

  async function handleReceive(orderId: string, itemId: string) {
    const state = receiveState[itemId];
    if (!state?.quantity || !state?.locationId) {
      setError('Enter a quantity and pick a location to receive into');
      return;
    }
    try {
      await api.post(`/procurement/orders/${orderId}/receive`, {
        itemId,
        quantity: Number(state.quantity),
        locationId: state.locationId,
      });
      setReceiveState((s) => ({ ...s, [itemId]: { quantity: '', locationId: '' } }));
      loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Receiving failed');
    }
  }

  return (
    <ProtectedRoute>
      <Navbar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-extrabold text-gray-900">Procurement</h1>
        <p className="mt-1 text-sm text-gray-500">
          Request, approve, and order goods from suppliers.
        </p>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-4 py-2 text-sm text-kasha-pink">{error}</p>
        )}

        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(['requests', 'orders', 'suppliers'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-semibold capitalize ${
                tab === t
                  ? 'border-b-2 border-brand-500 text-brand-500'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'requests' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form
                onSubmit={handleCreateRequest}
                className="rounded-lg border border-gray-200 bg-white p-6"
              >
                <p className="mb-3 text-sm font-bold uppercase tracking-widest text-brand-500">
                  New Purchase Request
                </p>
                {reqItems.map((item, idx) => (
                  <div key={idx} className="mb-2 flex gap-2">
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const next = [...reqItems];
                        next[idx].productId = e.target.value;
                        setReqItems(next);
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
                        const next = [...reqItems];
                        next[idx].quantity = Number(e.target.value);
                        setReqItems(next);
                      }}
                      className="w-24 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                    {reqItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setReqItems(reqItems.filter((_, i) => i !== idx))}
                        className="px-2 text-sm text-kasha-pink"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setReqItems([...reqItems, { productId: '', quantity: 1 }])}
                  className="mb-3 text-sm font-semibold text-brand-500 hover:underline"
                >
                  + Add another item
                </button>
                <input
                  placeholder="Notes (optional)"
                  value={reqNotes}
                  onChange={(e) => setReqNotes(e.target.value)}
                  className="mb-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
                  Submit Request
                </button>
              </form>
            )}

            <div className="space-y-3">
              {requests.length === 0 && (
                <p className="text-sm text-gray-500">No purchase requests yet.</p>
              )}
              {requests.map((r) => (
                <div key={r.id} className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        {r.requestedBy.firstName ?? r.requestedBy.email}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <ul className="mt-2 text-sm text-gray-600">
                    {r.items.map((i) => (
                      <li key={i.id}>
                        {i.quantity} x {i.product.name}
                      </li>
                    ))}
                  </ul>
                  {r.notes && <p className="mt-1 text-xs italic text-gray-400">{r.notes}</p>}
                  {r.status === 'REJECTED' && r.rejectionReason && (
                    <p className="mt-1 text-xs text-kasha-pink">Rejected: {r.rejectionReason}</p>
                  )}

                  {r.status === 'SUBMITTED' && canApprove && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleApprove(r.id)}
                        className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-600"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(r.id)}
                        className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        Reject
                      </button>
                    </div>
                  )}

                  {r.status === 'APPROVED' && canWrite && (
                    <div className="mt-3 flex items-center gap-2">
                      <select
                        value={convertSupplier[r.id] ?? ''}
                        onChange={(e) =>
                          setConvertSupplier((s) => ({ ...s, [r.id]: e.target.value }))
                        }
                        className="rounded-md border border-gray-300 px-2 py-1.5 text-xs"
                      >
                        <option value="">Supplier...</option>
                        {suppliers.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleConvert(r.id)}
                        className="rounded-md bg-kasha-yellow px-3 py-1.5 text-xs font-bold text-black hover:opacity-90"
                      >
                        Convert to Purchase Order
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'orders' && (
          <div className="mt-6 space-y-3">
            {orders.length === 0 && (
              <p className="text-sm text-gray-500">
                No purchase orders yet. Approve a request and convert it, or create one from the Requests tab.
              </p>
            )}
            {orders.map((o) => (
              <div key={o.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-800">{o.supplier.name}</span>
                  <StatusBadge status={o.status} />
                </div>
                <ul className="mt-2 space-y-2 text-sm text-gray-600">
                  {o.items.map((i) => {
                    const remaining = i.quantity - i.receivedQuantity;
                    return (
                      <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2">
                        <span>
                          {i.product.name} — {i.receivedQuantity}/{i.quantity} received
                        </span>
                        {remaining > 0 && canReceive && o.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="1"
                              max={remaining}
                              placeholder="qty"
                              value={receiveState[i.id]?.quantity ?? ''}
                              onChange={(e) =>
                                setReceiveState((s) => ({
                                  ...s,
                                  [i.id]: { ...s[i.id], quantity: e.target.value, locationId: s[i.id]?.locationId ?? '' },
                                }))
                              }
                              className="w-16 rounded-md border border-gray-300 px-2 py-1 text-xs"
                            />
                            <select
                              value={receiveState[i.id]?.locationId ?? ''}
                              onChange={(e) =>
                                setReceiveState((s) => ({
                                  ...s,
                                  [i.id]: { ...s[i.id], locationId: e.target.value, quantity: s[i.id]?.quantity ?? '' },
                                }))
                              }
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                            >
                              <option value="">Location...</option>
                              {locations.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleReceive(o.id, i.id)}
                              className="rounded-md bg-brand-500 px-2 py-1 text-xs font-bold text-white hover:bg-brand-600"
                            >
                              Receive
                            </button>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {o.status === 'DRAFT' && canWrite && (
                  <button
                    onClick={() => handleSend(o.id)}
                    className="mt-3 rounded-md border border-brand-500 px-3 py-1.5 text-xs font-bold text-brand-500 hover:bg-brand-50"
                  >
                    Mark as Sent
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'suppliers' && (
          <div className="mt-6 space-y-6">
            {canWrite && (
              <form
                onSubmit={handleCreateSupplier}
                className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
              >
                <input
                  required
                  placeholder="Supplier name"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  placeholder="Email (optional)"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
                <button className="rounded-md bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-600">
                  Add Supplier
                </button>
              </form>
            )}
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {suppliers.length === 0 ? (
                    <tr><td colSpan={2} className="px-4 py-6 text-gray-500">No suppliers yet.</td></tr>
                  ) : (
                    suppliers.map((s) => (
                      <tr key={s.id}>
                        <td className="px-4 py-3 font-semibold text-gray-800">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.email ?? '—'}</td>
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
