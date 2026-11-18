import { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { ArrowUpRight, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCompactCurrency, formatCurrency, formatDate } from '../lib/format.ts';
import type { DashboardSummary } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StatusText } from './ui/StatusText.tsx';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { settings } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currency = settings?.currencySymbol || '₹';

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<DashboardSummary>('/api/dashboard');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Unable to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 animate-pulse" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-red-200 dark:border-red-900/50 text-sm text-red-600 dark:text-red-400">
        <p className="mb-3">{error || 'Dashboard data unavailable.'}</p>
        <button
          type="button"
          onClick={loadDashboard}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const { kpis } = data;

  const primaryKpis = [
    { label: 'Total Revenue', value: formatCompactCurrency(kpis.totalRevenue, currency), sub: `${kpis.totalSalesCount} closed & active orders` },
    { label: 'Pending Payments', value: formatCompactCurrency(kpis.pendingPayments, currency), sub: 'Receivable balance due' },
    { label: 'Available Cars', value: String(kpis.availableCars), sub: `${kpis.totalCars} total units · ${kpis.reservedCars} reserved` },
    { label: 'Sold Cars', value: String(kpis.soldCars), sub: `${kpis.totalCustomers} registered customers` },
  ];

  const secondaryStrip = [
    { label: 'Total Fleet Units', value: kpis.totalCars },
    { label: 'Total Customers', value: kpis.totalCustomers },
    { label: 'Total Sales Orders', value: kpis.totalSalesCount },
    { label: 'Net Operating Margin', value: formatCompactCurrency(kpis.netProfit, currency) },
  ];

  return (
    <div className="space-y-6">
      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {primaryKpis.map((item) => (
          <div
            key={item.label}
            className="p-5 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800"
          >
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</div>
            <div className="font-mono text-2xl font-semibold tracking-tight text-slate-900 dark:text-white mt-2 tabular-nums">
              {item.value}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{item.sub}</div>
          </div>
        ))}
      </div>

      {/* Compact Secondary Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        {secondaryStrip.map((stat) => (
          <div key={stat.label} className="px-5 py-3.5 flex items-center justify-between gap-4">
            <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Monthly Revenue & Expenses
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dealership sales invoicing versus monthly operating costs
              </p>
            </div>
            <button
              type="button"
              onClick={loadDashboard}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.monthlyRevenue} margin={{ top: 8, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="#2563EB"
                  strokeWidth={2.2}
                  fillOpacity={1}
                  fill="url(#revGrad)"
                />
                <Area
                  type="monotone"
                  dataKey="expenses"
                  name="Expenses"
                  stroke="#64748B"
                  strokeWidth={1.8}
                  fillOpacity={0.08}
                  fill="#64748B"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Performance Leaderboard */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Sales Performance
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Advisor revenue vs monthly target
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('employees')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <span>Team</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-4 flex-1">
            {data.salesPerformance.map((emp) => (
              <div key={emp.employeeId} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{emp.name}</span>
                  <span className="font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                    {formatCompactCurrency(emp.revenue, currency)} / {formatCompactCurrency(emp.target, currency)}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${Math.min(100, emp.achievementPct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{emp.salesCount} vehicles closed</span>
                  <span className="font-mono tabular-nums">{emp.achievementPct}% of target</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Best Selling Cars + Recent Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Best-Selling Models
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('vehicles')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Inventory
            </button>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.bestSellingCars}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickFormatter={(v) => formatCompactCurrency(Number(v), currency)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="model"
                  type="category"
                  width={110}
                  tick={{ fontSize: 11, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: any) => formatCurrency(Number(value), currency)}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    border: '1px solid #1E293B',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="revenue" name="Gross Revenue" fill="#2563EB" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recent Sales
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('sales')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View all sales
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-3">Order</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Vehicle</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 pl-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {data.recentSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 pr-3 font-mono font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {sale.saleCode}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                      {sale.customerName}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-400 max-w-[180px] truncate">
                      {sale.items?.[0]?.vehicleLabel || '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                      {formatCompactCurrency(sale.finalAmount, currency)}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <StatusText status={sale.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Customers Table */}
      <div className="p-6 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Recent Customers
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('customers')}
            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Customer directory
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <th className="py-2.5 pr-3">ID</th>
                <th className="py-2.5 px-3">Customer Name</th>
                <th className="py-2.5 px-3">Contact</th>
                <th className="py-2.5 px-3">Location</th>
                <th className="py-2.5 px-3 text-right">Joined</th>
                <th className="py-2.5 pl-3 text-right">Total Spent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
              {data.recentCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                  <td className="py-3 pr-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {c.customerCode}
                  </td>
                  <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {c.fullName}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {c.mobile} · {c.email}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {c.city}, {c.state}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="py-3 pl-3 text-right font-mono font-medium text-slate-900 dark:text-slate-100 tabular-nums whitespace-nowrap">
                    {formatCurrency(c.totalSpent || 0, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
