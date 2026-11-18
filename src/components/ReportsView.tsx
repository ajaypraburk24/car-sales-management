import React, { useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, FileSpreadsheet, Plus, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format.ts';
import { exportCSV, exportReportPDF } from '../lib/exports.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Customer, Employee, Expense, Sale, Vehicle } from '../types.ts';
import { StatusText } from './ui/StatusText.tsx';

type ReportTab =
  | 'sales_period'
  | 'profit_loss'
  | 'stock'
  | 'customers'
  | 'employees'
  | 'pending_payments';

const PIE_COLORS = ['#2563EB', '#10B981', '#F59E0B', '#64748B'];

export function ReportsView() {
  const { settings, can } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canExpense = can('expenses:write');

  const [tab, setTab] = useState<ReportTab>('sales_period');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [sales, setSales] = useState<Sale[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  const [expCategory, setExpCategory] = useState('Showroom Operations');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));

  const loadAll = async () => {
    setLoading(true);
    try {
      const [s, v, c, e, ex] = await Promise.all([
        apiRequest<Sale[]>('/api/sales'),
        apiRequest<Vehicle[]>('/api/vehicles'),
        apiRequest<Customer[]>('/api/customers'),
        apiRequest<Employee[]>('/api/employees'),
        apiRequest<Expense[]>('/api/expenses').catch(() => [] as Expense[]),
      ]);
      setSales(s);
      setVehicles(v);
      setCustomers(c);
      setEmployees(e);
      setExpenses(ex);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const activeSales = useMemo(() => sales.filter((s) => s.status !== 'Cancelled'), [sales]);

  const periodBuckets = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; orders: number; collected: number }>();
    for (const s of activeSales) {
      let key = s.saleDate;
      if (period === 'monthly') key = s.saleDate.slice(0, 7);
      else if (period === 'yearly') key = s.saleDate.slice(0, 4);
      else if (period === 'weekly') {
        const d = new Date(s.saleDate);
        const startOfWeek = new Date(d);
        startOfWeek.setDate(d.getDate() - d.getDay());
        key = `Wk ${startOfWeek.toISOString().slice(5, 10)}`;
      }
      const existing = map.get(key) || { label: key, revenue: 0, orders: 0, collected: 0 };
      existing.revenue += s.finalAmount;
      existing.orders += 1;
      existing.collected += s.advancePaid;
      map.set(key, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [activeSales, period]);

  const stockBreakdown = useMemo(() => {
    const statuses = ['Available', 'Reserved', 'Sold', 'Under Maintenance'];
    return statuses.map((st) => ({
      name: st,
      value: vehicles.filter((v) => v.status === st).length,
    }));
  }, [vehicles]);

  const totalRevenue = activeSales.reduce((a, b) => a + b.finalAmount, 0);
  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const pendingSales = activeSales.filter((s) => s.remainingBalance > 0);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc || expAmount <= 0) return;
    await apiRequest('/api/expenses', {
      method: 'POST',
      body: JSON.stringify({
        category: expCategory,
        description: expDesc,
        amount: expAmount,
        expenseDate: expDate,
      }),
    });
    setExpDesc('');
    setExpAmount(0);
    await loadAll();
  };

  const handleDeleteExpense = async (id: number) => {
    await apiRequest(`/api/expenses/${id}`, { method: 'DELETE' });
    await loadAll();
  };

  const handleExport = (type: 'pdf' | 'csv') => {
    if (!settings) return;
    let title = 'Report';
    let headers: string[] = [];
    let rows: (string | number)[][] = [];

    if (tab === 'sales_period') {
      title = `${period.toUpperCase()} Sales Report`;
      headers = ['Period', 'Orders', 'Total Revenue', 'Collected'];
      rows = periodBuckets.map((b) => [b.label, b.orders, b.revenue, b.collected]);
    } else if (tab === 'profit_loss') {
      title = 'Profit and Loss Report';
      headers = ['Date', 'Category', 'Description', 'Expense Amount'];
      rows = [
        ...expenses.map((ex) => [ex.expenseDate, ex.category, ex.description, ex.amount]),
        ['SUMMARY', 'Total Revenue', 'All active vehicle sales', totalRevenue],
        ['SUMMARY', 'Total Expenses', 'Operating expenses', totalExpenses],
        ['SUMMARY', 'Net Profit', 'Revenue minus expenses', netProfit],
      ];
    } else if (tab === 'stock') {
      title = 'Vehicle Stock & Sold Vehicles Report';
      headers = ['Car ID', 'Brand', 'Model', 'Year', 'Fuel', 'Status', 'Stock', 'Selling Price'];
      rows = vehicles.map((v) => [v.carCode, v.brand, v.model, v.manufacturingYear, v.fuelType, v.status, v.stockQuantity, v.sellingPrice]);
    } else if (tab === 'customers') {
      title = 'Customer Report';
      headers = ['ID', 'Name', 'Mobile', 'Email', 'City', 'Purchases', 'Total Spend'];
      rows = customers.map((c) => [c.customerCode, c.fullName, c.mobile, c.email, c.city, c.totalPurchases || 0, c.totalSpent || 0]);
    } else if (tab === 'employees') {
      title = 'Employee Performance Report';
      headers = ['Emp ID', 'Name', 'Role', 'Target', 'Revenue Closed', 'Sales Count', 'Commission'];
      rows = employees.map((e) => [e.employeeCode, e.fullName, e.roleLabel || '', e.monthlyTarget, e.totalRevenue || 0, e.totalSalesCount || 0, e.earnedCommission || 0]);
    } else if (tab === 'pending_payments') {
      title = 'Pending Payments Report';
      headers = ['Sale ID', 'Date', 'Customer', 'Final Amount', 'Paid', 'Pending Balance'];
      rows = pendingSales.map((s) => [s.saleCode, s.saleDate, s.customerName || '', s.finalAmount, s.advancePaid, s.remainingBalance]);
    }

    if (type === 'pdf') exportReportPDF(title, headers, rows, settings);
    else exportCSV(title.toLowerCase().replace(/\s+/g, '-'), headers, rows);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          {[
            { id: 'sales_period', label: 'Sales Analytics' },
            { id: 'profit_loss', label: 'Profit & Loss' },
            { id: 'stock', label: 'Vehicle Stock' },
            { id: 'customers', label: 'Customers' },
            { id: 'employees', label: 'Team Performance' },
            { id: 'pending_payments', label: 'Pending Payments' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id as ReportTab)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                tab === item.id
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleExport('csv')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-medium"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Excel/CSV</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Generating analytics...</div>
      ) : (
        <>
          {tab === 'sales_period' && (
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                  <div>
                    <h3 className="font-display text-base font-semibold">Sales Revenue Breakdown</h3>
                    <p className="text-xs text-slate-500">Switch between Daily, Weekly, Monthly, and Yearly rollups</p>
                  </div>
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    {(['daily', 'weekly', 'monthly', 'yearly'] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPeriod(p)}
                        className={`px-3 py-1 rounded text-xs font-medium capitalize ${
                          period === p
                            ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                            : 'text-slate-500'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={periodBuckets}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                      <YAxis
                        tick={{ fontSize: 11, fill: '#94A3B8' }}
                        tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        formatter={(v: any) => formatCurrency(Number(v), currency)}
                        contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px', color: '#F8FAFC', fontSize: '12px' }}
                      />
                      <Bar dataKey="revenue" name="Total Invoiced" fill="#2563EB" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {tab === 'profit_loss' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Gross Dealership Revenue</div>
                  <div className="font-mono text-xl font-semibold text-blue-600 dark:text-blue-400 tabular-nums mt-1">
                    {formatCurrency(totalRevenue, currency)}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Operating Expenses</div>
                  <div className="font-mono text-xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                    {formatCurrency(totalExpenses, currency)}
                  </div>
                </div>
                <div className="p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500">Net Profit / Margin</div>
                  <div className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                    {formatCurrency(netProfit, currency)}
                  </div>
                </div>
              </div>

              {canExpense && (
                <form
                  onSubmit={handleAddExpense}
                  className="grid grid-cols-1 sm:grid-cols-5 gap-3 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800"
                >
                  <input
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    placeholder="Category"
                    className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <input
                    required
                    value={expDesc}
                    onChange={(e) => setExpDesc(e.target.value)}
                    placeholder="Expense description..."
                    className="sm:col-span-2 px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <input
                    type="number"
                    required
                    min={1}
                    value={expAmount || ''}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    placeholder="Amount"
                    className="px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Log Expense</span>
                  </button>
                </form>
              )}

              <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4 text-right">Amount</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {expenses.map((ex) => (
                      <tr key={ex.id}>
                        <td className="py-3 px-4 font-mono text-slate-500">{formatDate(ex.expenseDate)}</td>
                        <td className="py-3 px-4 font-medium">{ex.category}</td>
                        <td className="py-3 px-4">{ex.description}</td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(ex.amount, currency)}</td>
                        <td className="py-3 px-4 text-right">
                          {canExpense && (
                            <button
                              type="button"
                              onClick={() => handleDeleteExpense(ex.id)}
                              className="p-1 text-slate-400 hover:text-red-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'stock' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-4 p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
                <h3 className="font-display text-sm font-semibold mb-4">Inventory Status Split</h3>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={stockBreakdown} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                        {stockBreakdown.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 text-xs mt-2">
                  {stockBreakdown.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span>{item.name}</span>
                      </span>
                      <span className="font-mono font-semibold tabular-nums">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-8 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                        <th className="py-3 px-4">Car ID</th>
                        <th className="py-3 px-4">Model</th>
                        <th className="py-3 px-4 text-right">Stock</th>
                        <th className="py-3 px-4 text-right">Selling Price</th>
                        <th className="py-3 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {vehicles.map((v) => (
                        <tr key={v.id}>
                          <td className="py-3 px-4 font-mono text-slate-500">{v.carCode}</td>
                          <td className="py-3 px-4 font-medium">{v.brand} {v.model}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{v.stockQuantity}</td>
                          <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(v.sellingPrice, currency)}</td>
                          <td className="py-3 px-4"><StatusText status={v.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {tab === 'customers' && (
            <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <th className="py-3 px-4">Customer ID</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4 text-right">Purchases</th>
                    <th className="py-3 px-4 text-right">Total Spent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {customers.map((c) => (
                    <tr key={c.id}>
                      <td className="py-3 px-4 font-mono text-slate-500">{c.customerCode}</td>
                      <td className="py-3 px-4 font-medium">{c.fullName}</td>
                      <td className="py-3 px-4">{c.city}, {c.state}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{c.totalPurchases || 0}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">{formatCurrency(c.totalSpent || 0, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'employees' && (
            <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <th className="py-3 px-4">Emp ID</th>
                    <th className="py-3 px-4">Advisor</th>
                    <th className="py-3 px-4 text-right">Target</th>
                    <th className="py-3 px-4 text-right">Closed Revenue</th>
                    <th className="py-3 px-4 text-right">Commission</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {employees.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 px-4 font-mono text-slate-500">{e.employeeCode}</td>
                      <td className="py-3 px-4 font-medium">{e.fullName} ({e.roleLabel})</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(e.monthlyTarget, currency)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold tabular-nums">{formatCurrency(e.totalRevenue || 0, currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 tabular-nums">{formatCurrency(e.earnedCommission || 0, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'pending_payments' && (
            <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <th className="py-3 px-4">Sale ID</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Final Amount</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Pending Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {pendingSales.map((s) => (
                    <tr key={s.id}>
                      <td className="py-3 px-4 font-mono">{s.saleCode}</td>
                      <td className="py-3 px-4 font-medium">{s.customerName}</td>
                      <td className="py-3 px-4 font-mono text-slate-500">{formatDate(s.saleDate)}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">{formatCurrency(s.finalAmount, currency)}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-600 tabular-nums">{formatCurrency(s.advancePaid, currency)}</td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-amber-600 tabular-nums">{formatCurrency(s.remainingBalance, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
