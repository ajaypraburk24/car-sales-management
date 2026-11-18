import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Edit3, Trash2, MessageSquare } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Employee, Enquiry, EnquiryStatus, Vehicle } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

const ENQUIRY_STATUSES: EnquiryStatus[] = [
  'New',
  'Contacted',
  'Interested',
  'Test Drive Scheduled',
  'Converted',
  'Lost',
];

export function EnquiriesView() {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canWrite = can('enquiries:write');

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Enquiry | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    customerName: '',
    contactNumber: '',
    email: '',
    interestedVehicleId: '' as string | number,
    interestedCarLabel: '',
    budget: 10000000,
    enquiryDate: new Date().toISOString().slice(0, 10),
    followUpDate: new Date().toISOString().slice(0, 10),
    assignedEmployeeId: '' as string | number,
    status: 'New' as EnquiryStatus,
    followUpNotes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [enqData, vehData, empData] = await Promise.all([
        apiRequest<Enquiry[]>('/api/enquiries'),
        apiRequest<Vehicle[]>('/api/vehicles'),
        apiRequest<Employee[]>('/api/employees'),
      ]);
      setEnquiries(enqData);
      setVehicles(vehData);
      setEmployees(empData);
    } catch (err: any) {
      setError(err.message || 'Failed to load enquiries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      customerName: '',
      contactNumber: '',
      email: '',
      interestedVehicleId: vehicles[0]?.id || '',
      interestedCarLabel: vehicles[0] ? `${vehicles[0].brand} ${vehicles[0].model}` : '',
      budget: vehicles[0]?.sellingPrice || 10000000,
      enquiryDate: new Date().toISOString().slice(0, 10),
      followUpDate: new Date().toISOString().slice(0, 10),
      assignedEmployeeId: employees[0]?.id || '',
      status: 'New',
      followUpNotes: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (e: Enquiry) => {
    setEditing(e);
    setForm({
      customerName: e.customerName,
      contactNumber: e.contactNumber,
      email: e.email,
      interestedVehicleId: e.interestedVehicleId || '',
      interestedCarLabel: e.interestedCarLabel,
      budget: e.budget,
      enquiryDate: e.enquiryDate,
      followUpDate: e.followUpDate,
      assignedEmployeeId: e.assignedEmployeeId || '',
      status: e.status,
      followUpNotes: e.followUpNotes,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload = {
        ...form,
        interestedVehicleId: form.interestedVehicleId ? Number(form.interestedVehicleId) : null,
        assignedEmployeeId: form.assignedEmployeeId ? Number(form.assignedEmployeeId) : null,
      };
      if (editing) {
        await apiRequest(`/api/enquiries/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/enquiries', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save enquiry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/enquiries/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete enquiry');
    }
  };

  const handleStatusUpdate = async (id: number, status: EnquiryStatus) => {
    try {
      await apiRequest(`/api/enquiries/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const filtered = useMemo(() => {
    return enquiries.filter((e) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        `${e.enquiryCode} ${e.customerName} ${e.contactNumber} ${e.interestedCarLabel}`
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === 'All' || e.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [enquiries, search, statusFilter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lead name, phone, car model..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value="All">All Lead Statuses</option>
            {ENQUIRY_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Enquiry</span>
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
          <div className="p-8 text-center text-xs text-slate-500">Loading enquiries...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold">No enquiries found</h3>
            <p className="text-xs text-slate-500 mt-1">Log a new walk-in or online customer enquiry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Lead ID</th>
                  <th className="py-3 px-4">Prospect</th>
                  <th className="py-3 px-4">Interested Car</th>
                  <th className="py-3 px-4 text-right">Budget</th>
                  <th className="py-3 px-4">Follow-up</th>
                  <th className="py-3 px-4">Advisor</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{item.enquiryCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{item.customerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{item.contactNumber}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{item.interestedCarLabel || '—'}</div>
                      <div className="text-[11px] text-slate-500 max-w-[220px] truncate">{item.followUpNotes}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(item.budget, currency)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <div>Next: {formatDate(item.followUpDate)}</div>
                      <div className="text-slate-400">Logged: {formatDate(item.enquiryDate)}</div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{item.assignedEmployeeName}</td>
                    <td className="py-3 px-4">
                      {canWrite ? (
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusUpdate(item.id, e.target.value as EnquiryStatus)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        >
                          {ENQUIRY_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <StatusText status={item.status} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canWrite && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                            title="Edit Enquiry"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600"
                            title="Delete Enquiry"
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

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Enquiry · ${editing.enquiryCode}` : 'Add Customer Enquiry'}
        subtitle="Track lead interest, target budget, assigned advisor, and follow-up schedule"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Customer Name *</label>
              <input
                required
                value={form.customerName}
                onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Contact Number *</label>
              <input
                required
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
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
              <label className="block text-xs font-medium mb-1">Budget ({currency})</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Interested Car</label>
              <select
                value={form.interestedVehicleId}
                onChange={(e) => {
                  const vid = Number(e.target.value);
                  const found = vehicles.find((v) => v.id === vid);
                  setForm({
                    ...form,
                    interestedVehicleId: e.target.value,
                    interestedCarLabel: found ? `${found.brand} ${found.model}` : form.interestedCarLabel,
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Custom / Other Model</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.carCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sales Executive</label>
              <select
                value={form.assignedEmployeeId}
                onChange={(e) => setForm({ ...form, assignedEmployeeId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Enquiry Date</label>
              <input
                type="date"
                value={form.enquiryDate}
                onChange={(e) => setForm({ ...form, enquiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Follow-up Date</label>
              <input
                type="date"
                value={form.followUpDate}
                onChange={(e) => setForm({ ...form, followUpDate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Enquiry Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as EnquiryStatus })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {ENQUIRY_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Follow-up Notes</label>
              <textarea
                rows={3}
                value={form.followUpNotes}
                onChange={(e) => setForm({ ...form, followUpNotes: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              {saving ? 'Saving...' : editing ? 'Update Enquiry' : 'Save Enquiry'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
