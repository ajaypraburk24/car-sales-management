import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Trash2, CalendarClock } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Customer, Employee, TestDrive, TestDriveStatus, Vehicle } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

export function TestDrivesView() {
  const { can } = useAuth();
  const canWrite = can('test_drives:write');

  const [testDrives, setTestDrives] = useState<TestDrive[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerId: 0,
    vehicleId: 0,
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: '11:00',
    assignedEmployeeId: 0,
    status: 'Scheduled' as TestDriveStatus,
    feedbackNotes: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tdData, cData, vData, eData] = await Promise.all([
        apiRequest<TestDrive[]>('/api/test-drives'),
        apiRequest<Customer[]>('/api/customers'),
        apiRequest<Vehicle[]>('/api/vehicles'),
        apiRequest<Employee[]>('/api/employees'),
      ]);
      setTestDrives(tdData);
      setCustomers(cData);
      setVehicles(vData);
      setEmployees(eData);
    } catch (err: any) {
      setError(err.message || 'Failed to load test drives');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openScheduleModal = () => {
    setForm({
      customerId: customers[0]?.id || 0,
      vehicleId: vehicles.find((v) => v.status === 'Available')?.id || vehicles[0]?.id || 0,
      scheduledDate: new Date().toISOString().slice(0, 10),
      scheduledTime: '11:30',
      assignedEmployeeId: employees.find((e) => e.status === 'Active')?.id || employees[0]?.id || 0,
      status: 'Scheduled',
      feedbackNotes: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/api/test-drives', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to schedule test drive');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: number, status: TestDriveStatus) => {
    try {
      await apiRequest(`/api/test-drives/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/test-drives/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove booking');
    }
  };

  const filtered = useMemo(() => {
    return testDrives.filter((td) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        `${td.bookingCode} ${td.customerName} ${td.vehicleLabel} ${td.assignedEmployeeName}`
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === 'All' || td.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [testDrives, search, statusFilter]);

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
              placeholder="Search booking #, customer, vehicle..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value="All">All Bookings</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="No-Show">No-Show</option>
          </select>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openScheduleModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Test Drive</span>
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
          <div className="p-8 text-center text-xs text-slate-500">Loading test drive schedule...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="font-display text-base font-semibold">No test drives found</h3>
            <p className="text-xs text-slate-500 mt-1">Schedule a showroom or doorstep vehicle test drive.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Booking #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Assigned Advisor</th>
                  <th className="py-3 px-4">Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((td) => (
                  <tr key={td.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{td.bookingCode}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{td.customerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{td.customerMobile}</div>
                    </td>
                    <td className="py-3 px-4 font-medium">{td.vehicleLabel}</td>
                    <td className="py-3 px-4 font-mono whitespace-nowrap">
                      {formatDate(td.scheduledDate)} · {td.scheduledTime}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{td.assignedEmployeeName}</td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-500">{td.feedbackNotes || '—'}</td>
                    <td className="py-3 px-4">
                      {canWrite ? (
                        <select
                          value={td.status}
                          onChange={(e) => handleStatusChange(td.id, e.target.value as TestDriveStatus)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        >
                          <option value="Scheduled">Scheduled</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                          <option value="No-Show">No-Show</option>
                        </select>
                      ) : (
                        <StatusText status={td.status} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {canWrite && (
                        <button
                          type="button"
                          onClick={() => handleDelete(td.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600"
                          title="Delete booking"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
        title="Schedule Vehicle Test Drive"
        subtitle="Assign customer, demonstrator vehicle, slot time, and sales advisor"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Select Customer *</label>
              <select
                required
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.fullName} ({c.mobile})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Select Vehicle *</label>
              <select
                required
                value={form.vehicleId}
                onChange={(e) => setForm({ ...form, vehicleId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.carCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date *</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Time Slot *</label>
              <input
                type="time"
                required
                value={form.scheduledTime}
                onChange={(e) => setForm({ ...form, scheduledTime: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Assigned Sales Executive</label>
              <select
                value={form.assignedEmployeeId}
                onChange={(e) => setForm({ ...form, assignedEmployeeId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Route & Preferences Notes</label>
              <textarea
                rows={2}
                value={form.feedbackNotes}
                onChange={(e) => setForm({ ...form, feedbackNotes: e.target.value })}
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
              {saving ? 'Scheduling...' : 'Confirm Test Drive'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
