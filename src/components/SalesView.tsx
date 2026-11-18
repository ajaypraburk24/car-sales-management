import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, FileText } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Customer, Employee, PaymentMethod, Sale, SaleStatus, Vehicle } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

interface SalesViewProps {
  onOpenInvoice?: (invoiceId: number) => void;
}

export function SalesView({ onOpenInvoice }: SalesViewProps) {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const defaultGst = settings?.defaultGstRate ?? 28;
  const canWrite = can('sales:write');

  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerId, setCustomerId] = useState<number>(0);
  const [vehicleId, setVehicleId] = useState<number>(0);
  const [employeeId, setEmployeeId] = useState<number>(0);
  const [saleDate, setSaleDate] = useState(new Date().toISOString().slice(0, 10));
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(defaultGst);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank Transfer');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [emiBank, setEmiBank] = useState('');
  const [emiTenureMonths, setEmiTenureMonths] = useState<number>(60);
  const [notes, setNotes] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sData, cData, vData, eData] = await Promise.all([
        apiRequest<Sale[]>('/api/sales'),
        apiRequest<Customer[]>('/api/customers'),
        apiRequest<Vehicle[]>('/api/vehicles'),
        apiRequest<Employee[]>('/api/employees'),
      ]);
      setSales(sData);
      setCustomers(cData);
      setVehicles(vData);
      setEmployees(eData);
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const availableVehicles = useMemo(
    () => vehicles.filter((v) => v.status === 'Available' || v.status === 'Reserved'),
    [vehicles]
  );

  const openCreateModal = () => {
    const firstCust = customers[0]?.id || 0;
    const firstVeh = availableVehicles[0];
    const firstEmp = employees.find((e) => e.status === 'Active')?.id || employees[0]?.id || 0;

    setCustomerId(firstCust);
    setVehicleId(firstVeh?.id || 0);
    setEmployeeId(firstEmp);
    setSellingPrice(firstVeh?.sellingPrice || 0);
    setDiscountAmount(0);
    setGstRate(firstVeh?.fuelType === 'Electric' ? 5 : defaultGst);
    setAdvancePaid(0);
    setPaymentMethod('Bank Transfer');
    setReferenceNumber('');
    setEmiBank('');
    setNotes('');
    setError(null);
    setCreateOpen(true);
  };

  const handleVehicleSelect = (id: number) => {
    setVehicleId(id);
    const v = vehicles.find((item) => item.id === id);
    if (v) {
      setSellingPrice(v.sellingPrice);
      setGstRate(v.fuelType === 'Electric' ? 5 : defaultGst);
    }
  };

  const taxableValue = Math.max(0, sellingPrice - discountAmount);
  const gstAmount = Math.round((taxableValue * gstRate) / 100);
  const finalAmount = taxableValue + gstAmount;
  const remainingBalance = Math.max(0, finalAmount - advancePaid);
  const emiMonthlyAmount =
    paymentMethod === 'EMI' && emiTenureMonths > 0
      ? Math.round((remainingBalance > 0 ? remainingBalance : finalAmount) / emiTenureMonths)
      : undefined;

  const handleCreateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          customerId,
          vehicleId,
          employeeId,
          saleDate,
          sellingPrice,
          discountAmount,
          gstRate,
          advancePaid,
          paymentMethod,
          referenceNumber,
          emiBank: paymentMethod === 'EMI' ? emiBank : undefined,
          emiTenureMonths: paymentMethod === 'EMI' ? emiTenureMonths : undefined,
          emiMonthlyAmount,
          notes,
        }),
      });
      setCreateOpen(false);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to create sale');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (saleId: number, status: SaleStatus) => {
    try {
      await apiRequest(`/api/sales/${saleId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to update sale status');
    }
  };

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        `${s.saleCode} ${s.customerName} ${s.employeeName} ${s.items?.[0]?.vehicleLabel || ''}`
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesQ && matchesStatus;
    });
  }, [sales, search, statusFilter]);

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
              placeholder="Search order #, customer, vehicle..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value="All">All Sale Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        {canWrite && (
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Sale</span>
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
          <div className="p-8 text-center text-xs text-slate-500">Loading sales orders...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Sale ID</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4 text-right">Final Amount</th>
                  <th className="py-3 px-4 text-right">Paid</th>
                  <th className="py-3 px-4 text-right">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {s.saleCode}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{formatDate(s.saleDate)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{s.customerName}</div>
                      <div className="text-[11px] text-slate-500">Advisor: {s.employeeName}</div>
                    </td>
                    <td className="py-3 px-4 max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                      {s.items?.[0]?.vehicleLabel || '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium tabular-nums whitespace-nowrap">
                      {formatCurrency(s.finalAmount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(s.advancePaid, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(s.remainingBalance, currency)}
                    </td>
                    <td className="py-3 px-4">
                      {canWrite ? (
                        <select
                          value={s.status}
                          onChange={(e) => handleStatusChange(s.id, e.target.value as SaleStatus)}
                          className="px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      ) : (
                        <StatusText status={s.status} />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {s.invoiceId && onOpenInvoice ? (
                        <button
                          type="button"
                          onClick={() => onOpenInvoice(s.invoiceId!)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>{s.invoiceNumber}</span>
                        </button>
                      ) : (
                        <span className="font-mono text-slate-400">{s.invoiceNumber || '—'}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Sale Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Vehicle Sale"
        subtitle="Automatically calculates GST, generates tax invoice, and updates vehicle availability"
        maxWidthClass="max-w-3xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Select Customer *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.customerCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Select Vehicle *</label>
              <select
                required
                value={vehicleId}
                onChange={(e) => handleVehicleSelect(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {availableVehicles.length === 0 && <option value={0}>No available vehicles</option>}
                {availableVehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.carCode}) — {formatCurrency(v.sellingPrice, currency)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Assigned Sales Executive *</label>
              <select
                required
                value={employeeId}
                onChange={(e) => setEmployeeId(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Sale Date</label>
              <input
                type="date"
                required
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium mb-1">Selling Price ({currency})</label>
              <input
                type="number"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Discount ({currency})</label>
              <input
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">GST Rate (%)</label>
              <select
                value={gstRate}
                onChange={(e) => setGstRate(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value={5}>5% (EV Slab)</option>
                <option value={18}>18% Standard</option>
                <option value={28}>28% Luxury Auto</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Advance Paid ({currency})</label>
              <input
                type="number"
                min={0}
                max={finalAmount}
                value={advancePaid}
                onChange={(e) => setAdvancePaid(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* Live Financial Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <div className="text-slate-500">Taxable Value</div>
              <div className="font-mono font-semibold tabular-nums mt-0.5">{formatCurrency(taxableValue, currency)}</div>
            </div>
            <div>
              <div className="text-slate-500">GST ({gstRate}%)</div>
              <div className="font-mono font-semibold tabular-nums mt-0.5">{formatCurrency(gstAmount, currency)}</div>
            </div>
            <div>
              <div className="text-slate-500">Final Amount</div>
              <div className="font-mono font-semibold text-blue-600 dark:text-blue-400 tabular-nums mt-0.5">
                {formatCurrency(finalAmount, currency)}
              </div>
            </div>
            <div>
              <div className="text-slate-500">Remaining Balance</div>
              <div className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums mt-0.5">
                {formatCurrency(remainingBalance, currency)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Bank Transfer">Bank Transfer (RTGS / NEFT)</option>
                <option value="UPI">UPI</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="EMI">Auto Loan / EMI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Reference / UTR</label>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction or cheque reference"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>

            {paymentMethod === 'EMI' && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">Financier / Bank Name</label>
                  <input
                    value={emiBank}
                    onChange={(e) => setEmiBank(e.target.value)}
                    placeholder="e.g., HDFC Private Banking"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Tenure (Months)</label>
                  <input
                    type="number"
                    value={emiTenureMonths}
                    onChange={(e) => setEmiTenureMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Order Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Delivery schedule, accessories, insurance terms..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !vehicleId || !customerId}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium disabled:opacity-60"
            >
              {saving ? 'Processing Sale...' : 'Confirm Sale & Generate Invoice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
