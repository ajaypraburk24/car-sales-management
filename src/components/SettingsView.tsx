import React, { useEffect, useState } from 'react';
import { Save, Download, CheckCircle2, AlertCircle, Shield, Key } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { DealershipSettings, Role, User } from '../types.ts';

export function SettingsView() {
  const { settings, refreshSettings, can } = useAuth();
  const isAdmin = can('settings:write');

  const [form, setForm] = useState<DealershipSettings | null>(settings);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [uData, rData] = await Promise.all([
          apiRequest<User[]>('/api/users'),
          apiRequest<Role[]>('/api/roles'),
        ]);
        setUsers(uData);
        setRoles(rData);
      } catch {
        // non-admin may not have access
      }
    };
    loadUsers();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await apiRequest('/api/settings', {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await refreshSettings();
      setMessage('Dealership settings & tax preferences saved.');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    try {
      const res = await apiRequest<{ message: string }>('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setMessage(res.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    }
  };

  const handleUserUpdate = async (userId: number, updates: { roleId?: number; isActive?: boolean }) => {
    try {
      const updated = await apiRequest<User>(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
      setMessage('User access updated.');
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const data = await apiRequest<any>('/api/backup');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apex-motors-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      await refreshSettings();
      setMessage('Full relational database backup downloaded.');
    } catch (err: any) {
      setError(err.message || 'Backup export failed');
    }
  };

  if (!form) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {message && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dealership Profile & Tax Settings */}
      <form
        onSubmit={handleSaveSettings}
        className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 space-y-5"
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-display text-base font-semibold">Dealership Profile & Tax Configuration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Shown on official PDF invoices, receipts, and showroom headers</p>
          </div>
          {isAdmin && (
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">Dealership Name</label>
            <input
              disabled={!isAdmin}
              value={form.dealershipName}
              onChange={(e) => setForm({ ...form, dealershipName: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">GSTIN / Tax Registration Number</label>
            <input
              disabled={!isAdmin}
              value={form.gstNumber}
              onChange={(e) => setForm({ ...form, gstNumber: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Contact Phone</label>
            <input
              disabled={!isAdmin}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Official Email</label>
            <input
              disabled={!isAdmin}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">Showroom Street Address</label>
            <input
              disabled={!isAdmin}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">City</label>
            <input
              disabled={!isAdmin}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Default Standard GST Rate (%)</label>
            <input
              type="number"
              disabled={!isAdmin}
              value={form.defaultGstRate}
              onChange={(e) => setForm({ ...form, defaultGstRate: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium mb-1">Invoice Terms & Conditions</label>
            <textarea
              rows={3}
              disabled={!isAdmin}
              value={form.invoiceTerms}
              onChange={(e) => setForm({ ...form, invoiceTerms: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <h4 className="text-xs font-semibold mb-3">Notification Preferences</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={form.notifyLowStock}
                onChange={(e) => setForm({ ...form, notifyLowStock: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Low Vehicle Stock Alerts</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={form.notifyPendingPayments}
                onChange={(e) => setForm({ ...form, notifyPendingPayments: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Pending Payment Reminders</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={!isAdmin}
                checked={form.notifyTestDrives}
                onChange={(e) => setForm({ ...form, notifyTestDrives: e.target.checked })}
                className="rounded border-slate-300 text-blue-600"
              />
              <span>Daily Test Drive Digest</span>
            </label>
          </div>
        </div>
      </form>

      {/* Password & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handlePasswordChange}
          className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <h3 className="font-display text-sm font-semibold">Password Management</h3>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-medium"
          >
            Update Password
          </button>
        </form>

        {/* Backup Management */}
        <div className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="font-display text-sm font-semibold">Data Backup & Snapshot</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mt-1">
              Download a full JSON archive containing all 14 relational dealership tables (vehicles, customers, sales, invoices, payments, enquiries, test drives, employees, and settings).
            </p>
            <div className="mt-4 text-xs text-slate-500">
              Last backup: <span className="font-mono font-medium">{formatDate(form.lastBackupAt)}</span>
            </div>
          </div>
          {isAdmin && (
            <div>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Full Database Backup</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User Management (Admin Only) */}
      {isAdmin && users.length > 0 && (
        <div className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-sm font-semibold mb-4">User Access & Role Management</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Account Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => (
                  <tr key={u.id}>
                    <td className="py-2.5 px-3 font-medium">{u.fullName}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-500">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <select
                        value={u.roleId}
                        onChange={(e) => handleUserUpdate(u.id, { roleId: Number(e.target.value) })}
                        className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                      >
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>{r.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleUserUpdate(u.id, { isActive: !u.isActive })}
                        className={`px-3 py-1 rounded text-xs font-medium ${
                          u.isActive
                            ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                            : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30'
                        }`}
                      >
                        {u.isActive ? 'Active (Click to Disable)' : 'Disabled (Click to Enable)'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
