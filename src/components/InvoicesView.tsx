import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, Printer, Search, Car } from 'lucide-react';
import { apiRequest } from '../lib/api.ts';
import { formatCurrency, formatDate } from '../lib/format.ts';
import { downloadInvoicePDF } from '../lib/exports.ts';
import { useAuth } from '../context/AuthContext.tsx';
import type { Invoice } from '../types.ts';
import { Modal } from './ui/Modal.tsx';
import { StatusText } from './ui/StatusText.tsx';

interface InvoicesViewProps {
  initialInvoiceId?: number | null;
}

export function InvoicesView({ initialInvoiceId }: InvoicesViewProps) {
  const { settings } = useAuth();
  const currency = settings?.currencySymbol || '₹';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<Invoice[]>('/api/invoices');
        setInvoices(data);
        if (initialInvoiceId) {
          const found = data.find((i) => i.id === initialInvoiceId);
          if (found) setSelectedInvoice(found);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [initialInvoiceId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return invoices;
    return invoices.filter((inv) =>
      `${inv.invoiceNumber} ${inv.sale?.saleCode || ''} ${inv.customer?.fullName || ''} ${inv.vehicle?.brand || ''} ${inv.vehicle?.model || ''}`
        .toLowerCase()
        .includes(q)
    );
  }, [invoices, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice #, sale #, customer, vehicle..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
          />
        </div>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#11151D] border border-slate-200 dark:border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading tax invoices...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4 text-right">Final Amount</th>
                  <th className="py-3 px-4 text-right">Due Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-xs">
                {filtered.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">{inv.invoiceNumber}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{formatDate(inv.invoiceDate)}</td>
                    <td className="py-3 px-4 font-medium">{inv.customer?.fullName || inv.sale?.customerName || '—'}</td>
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                      {inv.vehicle ? `${inv.vehicle.brand} ${inv.vehicle.model}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums whitespace-nowrap">
                      {formatCurrency(inv.sale?.finalAmount || 0, currency)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-amber-600 dark:text-amber-400 tabular-nums whitespace-nowrap">
                      {formatCurrency(inv.dueAmount, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusText status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      {settings && (
                        <button
                          type="button"
                          onClick={() => downloadInvoicePDF(inv, settings)}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>PDF</span>
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

      {/* Invoice Document Preview Modal */}
      <Modal
        open={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Tax Invoice · ${selectedInvoice.invoiceNumber}` : ''}
        maxWidthClass="max-w-3xl"
      >
        {selectedInvoice && settings && (
          <div className="space-y-6 text-xs">
            {/* Printable Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 p-5 rounded-lg bg-slate-900 text-white">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-semibold">{settings.dealershipName}</div>
                  <div className="text-slate-300 text-[11px] mt-0.5">
                    {settings.address}, {settings.city}, {settings.state}
                  </div>
                  <div className="font-mono text-slate-300 text-[11px] mt-0.5">
                    GSTIN: {settings.gstNumber} · {settings.phone}
                  </div>
                </div>
              </div>
              <div className="sm:text-right">
                <div className="font-display text-base font-semibold tracking-wide">TAX INVOICE</div>
                <div className="font-mono text-slate-300 mt-0.5">{selectedInvoice.invoiceNumber}</div>
                <div className="font-mono text-slate-400 text-[11px]">Date: {formatDate(selectedInvoice.invoiceDate)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[11px] font-medium text-slate-500 mb-1">Billed To</div>
                <div className="font-semibold text-sm">{selectedInvoice.customer?.fullName}</div>
                <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {selectedInvoice.customer?.address}, {selectedInvoice.customer?.city}, {selectedInvoice.customer?.state} - {selectedInvoice.customer?.pinCode}
                </div>
                <div className="font-mono text-slate-500 mt-1">{selectedInvoice.customer?.mobile}</div>
              </div>
              <div className="sm:text-right">
                <div className="text-[11px] font-medium text-slate-500 mb-1">Transaction Details</div>
                <div>Sale Reference: <span className="font-mono font-medium">{selectedInvoice.sale?.saleCode}</span></div>
                <div>Payment Mode: <span className="font-medium">{selectedInvoice.sale?.paymentMethod}</span></div>
                <div className="mt-1 flex sm:justify-end"><StatusText status={selectedInvoice.status} /></div>
              </div>
            </div>

            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                    <th className="py-2.5 px-3">Vehicle Particulars</th>
                    <th className="py-2.5 px-3 text-right">Ex-Showroom / Unit</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Taxable Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-3 px-3">
                      <div className="font-medium">
                        {selectedInvoice.vehicle
                          ? `${selectedInvoice.vehicle.brand} ${selectedInvoice.vehicle.model} (${selectedInvoice.vehicle.variant})`
                          : selectedInvoice.sale?.items?.[0]?.vehicleLabel}
                      </div>
                      {selectedInvoice.vehicle && (
                        <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                          Reg: {selectedInvoice.vehicle.registrationNumber} · {selectedInvoice.vehicle.fuelType} · {selectedInvoice.vehicle.colour}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      {formatCurrency(selectedInvoice.sale?.subtotal || 0, currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 tabular-nums">
                      -{formatCurrency(selectedInvoice.sale?.discountAmount || 0, currency)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-medium tabular-nums">
                      {formatCurrency((selectedInvoice.sale?.subtotal || 0) - (selectedInvoice.sale?.discountAmount || 0), currency)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row justify-between gap-6 pt-2">
              <div className="flex-1 text-[11px] text-slate-500 whitespace-pre-line">
                <div className="font-semibold text-slate-700 dark:text-slate-300 mb-1">Terms & Conditions</div>
                {selectedInvoice.termsAndConditions}
              </div>
              <div className="w-full sm:w-64 space-y-2 p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-500">CGST ({(selectedInvoice.sale?.gstRate || 28) / 2}%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency(Math.round((selectedInvoice.sale?.gstAmount || 0) / 2), currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">SGST ({(selectedInvoice.sale?.gstRate || 28) / 2}%)</span>
                  <span className="font-mono tabular-nums">
                    {formatCurrency((selectedInvoice.sale?.gstAmount || 0) - Math.round((selectedInvoice.sale?.gstAmount || 0) / 2), currency)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold text-sm">
                  <span>Final Total</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedInvoice.sale?.finalAmount || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Advance Paid</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedInvoice.sale?.advancePaid || 0, currency)}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-semibold">
                  <span>Pending Balance</span>
                  <span className="font-mono tabular-nums">{formatCurrency(selectedInvoice.dueAmount, currency)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                type="button"
                onClick={() => downloadInvoicePDF(selectedInvoice, settings)}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF Invoice</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
