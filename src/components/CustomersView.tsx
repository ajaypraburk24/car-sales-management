import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit3, Trash2, UserCheck, Eye } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Customer, Sale } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

const INITIAL_CUSTOMER = {
  fullName: '',
  mobile: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pinCode: '',
  idProofType: 'PAN' as Customer['idProofType'],
  idProofNumber: '',
};

export function CustomersView() {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canWrite = can('customers:write');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [form, setForm] = useState(INITIAL_CUSTOMER);
  const [saving, setSaving] = useState(false);

  const [profileCustomer, setProfileCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [custData, salesData] = await Promise.all([
        apiRequest<Customer[]>('/api/customers'),
        apiRequest<Sale[]>('/api/sales'),
      ]);
      setCustomers(custData);
      setSales(salesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.customerCode} ${c.fullName} ${c.mobile} ${c.email} ${c.city} ${c.state}`
        .toLowerCase()
        .includes(q)
    );
  }, [customers, search]);

  const maskIdProof = (val: string) => {
    if (!val) return 'Not provided';
    if (val.length <= 4) return val;
    return `${'•'.repeat(Math.max(2, val.length - 4))}${val.slice(-4)}`;
  };

  const openCreate = () => {
    setEditing(null);
    setForm(INITIAL_CUSTOMER);
    setError(null);
    setFormOpen(true);
  };

  const openEdit = (c: Customer) => {
    setEditing(c);
    setForm({
      fullName: c.fullName,
      mobile: c.mobile,
      email: c.email,
      address: c.address,
      city: c.city,
      state: c.state,
      pinCode: c.pinCode,
      idProofType: c.idProofType,
      idProofNumber: c.idProofNumber,
    });
    setError(null);
    setFormOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiRequest(`/api/customers/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(form),
        });
      } else {
        await apiRequest('/api/customers', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setFormOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c: Customer) => {
    try {
      await apiRequest(`/api/customers/${c.id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete customer');
    }
  };

  const customerHistory = useMemo(() => {
    if (!profileCustomer) return [];
    return sales.filter((s) => s.customerId === profileCustomer.id);
  }, [profileCustomer, sales]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer ID, name, mobile, city..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading customer records...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserCheck className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold">No customers found</h3>
            <p className="text-xs text-slate-500 mt-1">Add your first customer profile to track enquiries and sales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Customer ID</th>
                  <th className="py-3 px-4">Full Name</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">City / State</th>
                  <th className="py-3 px-4">KYC (Masked)</th>
                  <th className="py-3 px-4 text-right">Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Value</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {c.customerCode}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {c.fullName}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 dark:text-slate-200">{c.mobile}</div>
                      <div className="text-[11px] text-slate-500">{c.email || '—'}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {c.city ? `${c.city}, ${c.state}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {c.idProofType !== 'None' ? `${c.idProofType}: ${maskIdProof(c.idProofNumber)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums">{c.totalPurchases || 0}</td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                      {formatCurrency(c.totalSpent || 0, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setProfileCustomer(c)}
                        className="p-1.5 text-slate-500 hover:text-blue-600"
                        title="View Customer Profile & History"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(c)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Edit Customer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 text-slate-500 hover:text-red-600"
                            title="Delete Customer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Profile + Purchase History Modal */}
      <Modal
        open={!!profileCustomer}
        onClose={() => setProfileCustomer(null)}
        title={profileCustomer?.fullName || 'Customer Profile'}
        subtitle={profileCustomer ? `${profileCustomer.customerCode} · Registered ${formatDate(profileCustomer.createdAt)}` : ''}
        maxWidthClass="max-w-3xl"
      >
        {profileCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div><span className="text-slate-500 block">Mobile Number</span><span className="font-mono font-medium">{profileCustomer.mobile}</span></div>
              <div><span className="text-slate-500 block">Email Address</span><span className="font-medium">{profileCustomer.email || '—'}</span></div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Residential / Billing Address</span>
                <span className="font-medium">
                  {profileCustomer.address}, {profileCustomer.city}, {profileCustomer.state} - {profileCustomer.pinCode}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">ID Verification</span>
                <span className="font-mono font-medium">
                  {profileCustomer.idProofType}: {maskIdProof(profileCustomer.idProofNumber)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Dealership Spend</span>
                <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums">
                  {formatCurrency(profileCustomer.totalSpent || 0, currency)}
                </span>
              </div>
            </div>

            <div>
              <h4 className="font-display text-sm font-semibold mb-3">Purchase History</h4>
              {customerHistory.length === 0 ? (
                <div className="p-6 text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                  No vehicle purchases recorded for this customer yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-lg">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-[11px] text-slate-500">
                        <th className="py-2.5 px-3">Sale #</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Vehicle</th>
                        <th className="py-2.5 px-3 text-right">Final Amount</th>
                        <th className="py-2.5 px-3 text-right">Balance</th>
                        <th className="py-2.5 px-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {customerHistory.map((s) => (
                        <tr key={s.id}>
                          <td className="py-2.5 px-3 font-mono">{s.saleCode}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{formatDate(s.saleDate)}</td>
                          <td className="py-2.5 px-3">{s.items?.[0]?.vehicleLabel || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(s.finalAmount, currency)}</td>
                          <td className="py-2.5 px-3 text-right font-mono tabular-nums">{formatCurrency(s.remainingBalance, currency)}</td>
                          <td className="py-2.5 px-3 text-right"><StatusText status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Customer Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Customer · ${editing.customerCode}` : 'Register New Customer'}
        subtitle="Address, contact, and optional KYC identification"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Full Name *</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Mobile Number *</label>
              <input
                required
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                placeholder="+91 98..."
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">PIN Code</label>
              <input
                value={form.pinCode}
                onChange={(e) => setForm({ ...form, pinCode: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Street Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">State</label>
              <input
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Aadhaar / PAN Type (Optional)</label>
              <select
                value={form.idProofType}
                onChange={(e) => setForm({ ...form, idProofType: e.target.value as Customer['idProofType'] })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="None">None</option>
                <option value="PAN">PAN Card</option>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="Passport">Passport</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">ID Number (Stored Masked)</label>
              <input
                value={form.idProofNumber}
                onChange={(e) => setForm({ ...form, idProofNumber: e.target.value })}
                placeholder="Optional document ID"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              {saving ? 'Saving...' : editing ? 'Update Customer' : 'Save Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
