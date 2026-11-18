import React, { useEffect, useState } from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Employee, Role } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

export function EmployeesView() {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canWrite = can('employees:write');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    roleId: 3,
    department: 'Luxury Passenger Sales',
    monthlyTarget: 15000000,
    commissionRate: 2.0,
    joiningDate: new Date().toISOString().slice(0, 10),
    status: 'Active' as Employee['status'],
    password: 'Welcome@123',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empData, rolesData] = await Promise.all([
        apiRequest<Employee[]>('/api/employees'),
        apiRequest<Role[]>('/api/roles'),
      ]);
      setEmployees(empData);
      setRoles(rolesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
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
      fullName: '',
      email: '',
      phone: '',
      roleId: 3,
      department: 'Luxury Passenger Sales',
      monthlyTarget: 15000000,
      commissionRate: 2.0,
      joiningDate: new Date().toISOString().slice(0, 10),
      status: 'Active',
      password: 'Welcome@123',
    });
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setForm({
      fullName: emp.fullName,
      email: emp.email,
      phone: emp.phone,
      roleId: emp.roleId,
      department: emp.department,
      monthlyTarget: emp.monthlyTarget,
      commissionRate: emp.commissionRate,
      joiningDate: emp.joiningDate,
      status: emp.status,
      password: '',
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        const { password: _p, ...updatePayload } = form;
        await apiRequest(`/api/employees/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(updatePayload),
        });
      } else {
        await apiRequest('/api/employees', {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiRequest(`/api/employees/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete employee');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="font-display text-sm font-semibold">Showroom Staff, Targets & Commission</h3>
          <p className="text-xs text-slate-500">Manage dealership login roles, monthly quotas, and earned commission</p>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Employee</span>
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
          <div className="p-8 text-center text-xs text-slate-500">Loading staff roster...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Emp ID</th>
                  <th className="py-3 px-4">Employee & Role</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4 text-right">Monthly Target</th>
                  <th className="py-3 px-4 text-right">Revenue Closed</th>
                  <th className="py-3 px-4 text-right">Commission</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {employees.map((emp) => {
                  const rev = emp.totalRevenue || 0;
                  const pct = emp.monthlyTarget > 0 ? Math.round((rev / emp.monthlyTarget) * 100) : 0;
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{emp.employeeCode}</td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-900 dark:text-white">{emp.fullName}</div>
                        <div className="text-[11px] text-slate-500">
                          {emp.roleLabel} · {emp.email}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>{emp.department}</div>
                        <div className="text-[11px] text-slate-400">Joined {formatDate(emp.joiningDate)}</div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                        {formatCompactCurrency(emp.monthlyTarget, currency)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-semibold tabular-nums">
                          {formatCompactCurrency(rev, currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {emp.totalSalesCount || 0} sales · {pct}%
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="font-mono font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatCurrency(emp.earnedCommission || 0, currency)}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">{emp.commissionRate}% rate</div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusText status={emp.status} />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {canWrite && (
                          <>
                            <button
                              type="button"
                              onClick={() => openEdit(emp)}
                              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                              title="Edit Employee"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(emp.id)}
                              className="p-1.5 text-slate-500 hover:text-red-600"
                              title="Delete Employee"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Employee · ${editing.employeeCode}` : 'Add New Dealership Employee'}
        subtitle="Creates employee profile and dealership login credentials"
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
              <label className="block text-xs font-medium mb-1">Work Email *</label>
              <input
                type="email"
                required
                disabled={!!editing}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assigned Role</label>
              <select
                value={form.roleId}
                onChange={(e) => setForm({ ...form, roleId: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Department</label>
              <input
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Employee['status'] })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Monthly Sales Target ({currency})</label>
              <input
                type="number"
                value={form.monthlyTarget}
                onChange={(e) => setForm({ ...form, monthlyTarget: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: Number(e.target.value) })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            {!editing && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium mb-1">Initial Portal Password *</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                />
              </div>
            )}
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
              {saving ? 'Saving...' : editing ? 'Update Employee' : 'Create Employee & Login'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
