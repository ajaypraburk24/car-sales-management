import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, Search } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';
import { downloadReceiptPDF } from '../lib/exports.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Payment, PaymentMethod, Sale } from '../types.ts';
import { Modal } from './ui/Modal.tsx';

export function PaymentsView() {
  const { can, settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';
  const canWrite = can('payments:write');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [saleId, setSaleId] = useState<number>(0);
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentType, setPaymentType] = useState<Payment['paymentType']>('Installment');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [emiBank, setEmiBank] = useState('');
  const [emiTenureMonths, setEmiTenureMonths] = useState<number>(48);
  const [emiMonthlyAmount, setEmiMonthlyAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [payData, salesData] = await Promise.all([
        apiRequest<Payment[]>('/api/payments'),
        apiRequest<Sale[]>('/api/sales'),
      ]);
      setPayments(payData);
      setSales(salesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openSalesWithBalance = useMemo(
    () => sales.filter((s) => s.status !== 'Cancelled' && s.remainingBalance > 0),
    [sales]
  );

  const openRecordModal = () => {
    const first = openSalesWithBalance[0];
    setSaleId(first?.id || 0);
    setAmount(first?.remainingBalance || 0);
    setPaymentMethod('Bank Transfer');
    setPaymentType('Final Settlement');
    setReferenceNumber('');
    setEmiBank('');
    setEmiTenureMonths(48);
    setEmiMonthlyAmount(0);
    setNotes('');
    setError(null);
    setModalOpen(true);
  };

  const selectedSale = sales.find((s) => s.id === saleId);

  const handleRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiRequest('/api/payments', {
        method: 'POST',
        body: JSON.stringify({
          saleId,
          amount,
          paymentMethod,
          paymentType,
          referenceNumber,
          paymentDate,
          notes,
          emiBank: paymentMethod === 'EMI' ? emiBank : undefined,
          emiTenureMonths: paymentMethod === 'EMI' ? emiTenureMonths : undefined,
          emiMonthlyAmount: paymentMethod === 'EMI' ? emiMonthlyAmount : undefined,
        }),
      });
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesQ =
        !q ||
        `${p.receiptNumber} ${p.saleCode} ${p.customerName} ${p.referenceNumber}`.toLowerCase().includes(q);
      const matchesMethod = methodFilter === 'All' || p.paymentMethod === methodFilter;
      return matchesQ && matchesMethod;
    });
  }, [payments, search, methodFilter]);

  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPending = openSalesWithBalance.reduce((sum, s) => sum + s.remainingBalance, 0);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Total Collected</div>
          <div className="font-mono text-xl font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
            {formatCurrency(totalCollected, currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Outstanding Receivables</div>
          <div className="font-mono text-xl font-semibold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
            {formatCurrency(totalPending, currency)}
          </div>
        </div>
        <div className="p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Total Receipts Issued</div>
          <div className="font-mono text-xl font-semibold tabular-nums mt-1">{payments.length}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, customer, UTR..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Credit/Debit Card">Credit/Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="EMI">EMI</option>
          </select>
        </div>

        {canWrite && (
          <button
            type="button"
            onClick={openRecordModal}
            disabled={openSalesWithBalance.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
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
          <div className="p-8 text-center text-xs text-slate-500">Loading payment ledger...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Receipt #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer / Sale</th>
                  <th className="py-3 px-4">Method & Type</th>
                  <th className="py-3 px-4">Reference / EMI</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4 text-right">Receipt PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">{p.receiptNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{formatDate(p.paymentDate)}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.customerName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{p.saleCode}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{p.paymentMethod}</div>
                      <div className="text-[11px] text-slate-500">{p.paymentType}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                      <div>{p.referenceNumber || '—'}</div>
                      {p.emiBank && (
                        <div>{p.emiBank} · {p.emiTenureMonths}m</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(p.amount, currency)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {settings && (
                        <button
                          type="button"
                          onClick={() => downloadReceiptPDF(p, settings)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Receipt</span>
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

      {/* Record Payment Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Customer Payment"
        subtitle="Updates remaining sale balance and invoice settlement status automatically"
      >
        <form onSubmit={handleRecord} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">Select Pending Sale Order *</label>
            <select
              required
              value={saleId}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSaleId(id);
                const found = sales.find((s) => s.id === id);
                if (found) setAmount(found.remainingBalance);
              }}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            >
              {openSalesWithBalance.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.saleCode} — {s.customerName} (Due: {formatCurrency(s.remainingBalance, currency)})
                </option>
              ))}
            </select>
          </div>

          {selectedSale && (
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <span>Remaining Balance on {selectedSale.saleCode}</span>
              <span className="font-mono font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                {formatCurrency(selectedSale.remainingBalance, currency)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Amount ({currency}) *</label>
              <input
                type="number"
                required
                min={1}
                max={selectedSale?.remainingBalance}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="UPI">UPI</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
                <option value="Cash">Cash</option>
                <option value="EMI">EMI</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Payment Type</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as Payment['paymentType'])}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              >
                <option value="Advance">Advance</option>
                <option value="Installment">Installment</option>
                <option value="Final Settlement">Final Settlement</option>
                <option value="Booking">Booking</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Reference / UTR Number</label>
              <input
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="UTR / UPI / POS Authorization #"
                className="w-full px-3 py-2 text-xs font-mono rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
              />
            </div>
            {paymentMethod === 'EMI' && (
              <>
                <div>
                  <label className="block text-xs font-medium mb-1">Financier Bank</label>
                  <input
                    value={emiBank}
                    onChange={(e) => setEmiBank(e.target.value)}
                    placeholder="Bank name"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">EMI Tenure (Months)</label>
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
            <label className="block text-xs font-medium mb-1">Notes</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
            />
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
              {saving ? 'Recording...' : 'Save Payment & Issue Receipt'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
