import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { DealershipSettings, Invoice, Payment } from '../types.ts';
import { formatDate } from './format.ts';

function pdfMoney(val: number): string {
  return `INR ${Number(val || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function downloadInvoicePDF(invoice: Invoice, settings: DealershipSettings) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const sale = invoice.sale;
  const customer = invoice.customer;
  const vehicle = invoice.vehicle;

  // Header band
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595.28, 96, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(settings.dealershipName || 'Apex Prestige Motors', 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`${settings.address}, ${settings.city}, ${settings.state}`, 40, 60);
  doc.text(`GSTIN: ${settings.gstNumber}  |  Tel: ${settings.phone}  |  ${settings.email}`, 40, 74);

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('TAX INVOICE', 555, 42, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 555, 60, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, 555, 74, { align: 'right' });

  // Customer & Dealership Info
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('BILLED TO', 40, 125);
  doc.text('SALE SUMMARY', 340, 125);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(customer?.fullName || sale?.customerName || 'Walk-in Customer', 40, 142);
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(9);
  if (customer?.address) doc.text(`${customer.address}`, 40, 156);
  if (customer?.city) doc.text(`${customer.city}, ${customer.state} - ${customer.pinCode}`, 40, 170);
  doc.text(`Mobile: ${customer?.mobile || sale?.customerMobile || '—'}`, 40, 184);
  if (customer?.email) doc.text(`Email: ${customer.email}`, 40, 198);

  doc.text(`Sale Reference: ${sale?.saleCode || '—'}`, 340, 142);
  doc.text(`Sales Advisor: ${sale?.employeeName || '—'}`, 340, 156);
  doc.text(`Payment Method: ${sale?.paymentMethod || '—'}`, 340, 170);
  doc.text(`Invoice Status: ${invoice.status}`, 340, 184);

  // Vehicle & Pricing Table
  const vehicleTitle = vehicle
    ? `${vehicle.brand} ${vehicle.model} (${vehicle.variant})`
    : sale?.items?.[0]?.vehicleLabel || 'Vehicle';
  const vehicleSpecs = vehicle
    ? `VIN/Reg: ${vehicle.registrationNumber} | Year: ${vehicle.manufacturingYear} | Fuel: ${vehicle.fuelType} | Color: ${vehicle.colour}`
    : '';

  autoTable(doc, {
    startY: 222,
    head: [['Description', 'Qty', 'Ex-Showroom / Unit', 'Discount', 'Taxable Value']],
    body: [
      [
        `${vehicleTitle}\n${vehicleSpecs}`,
        '1',
        pdfMoney(sale?.subtotal || 0),
        pdfMoney(sale?.discountAmount || 0),
        pdfMoney((sale?.subtotal || 0) - (sale?.discountAmount || 0)),
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    styles: { fontSize: 9, cellPadding: 8 },
    columnStyles: {
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'right', cellWidth: 100 },
      3: { halign: 'right', cellWidth: 90 },
      4: { halign: 'right', cellWidth: 100 },
    },
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 310;
  const taxable = (sale?.subtotal || 0) - (sale?.discountAmount || 0);
  const halfGstRate = (sale?.gstRate || 28) / 2;
  const halfGstAmt = Math.round((sale?.gstAmount || 0) / 2);

  // Totals block
  const summaryRows = [
    ['Taxable Amount', pdfMoney(taxable)],
    [`CGST (${halfGstRate}%)`, pdfMoney(halfGstAmt)],
    [`SGST (${halfGstRate}%)`, pdfMoney(sale ? sale.gstAmount - halfGstAmt : 0)],
    ['Total Invoice Value', pdfMoney(sale?.finalAmount || 0)],
    ['Advance / Amount Paid', pdfMoney(sale?.advancePaid || 0)],
    ['Pending Balance Due', pdfMoney(invoice.dueAmount)],
  ];

  autoTable(doc, {
    startY: finalY + 18,
    margin: { left: 310 },
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 5 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [71, 85, 105] },
      1: { halign: 'right', fontStyle: 'bold', textColor: [15, 23, 42] },
    },
  });

  const summaryEndY = (doc as any).lastAutoTable?.finalY || finalY + 140;

  // Terms & Conditions
  doc.setDrawColor(226, 232, 240);
  doc.line(40, summaryEndY + 20, 555, summaryEndY + 20);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Terms & Conditions', 40, summaryEndY + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  const splitTerms = doc.splitTextToSize(invoice.termsAndConditions || settings.invoiceTerms, 515);
  doc.text(splitTerms, 40, summaryEndY + 54);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`For ${settings.dealershipName}`, 555, 760, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text('Authorized Signatory', 555, 790, { align: 'right' });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function downloadReceiptPDF(payment: Payment, settings: DealershipSettings) {
  const doc = new jsPDF({ unit: 'pt', format: 'a5', orientation: 'landscape' });

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 595.28, 68, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.dealershipName, 32, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`OFFICIAL PAYMENT RECEIPT  |  ${payment.receiptNumber}`, 32, 52);

  autoTable(doc, {
    startY: 88,
    body: [
      ['Receipt Number', payment.receiptNumber, 'Payment Date', formatDate(payment.paymentDate)],
      ['Customer', payment.customerName || '—', 'Sale Order', payment.saleCode || '—'],
      ['Payment Method', payment.paymentMethod, 'Payment Type', payment.paymentType],
      ['Reference / UTR', payment.referenceNumber || '—', 'Amount Received', pdfMoney(payment.amount)],
      ...(payment.emiBank
        ? [['Financier Bank', payment.emiBank, 'EMI Plan', `${payment.emiTenureMonths} mos @ ${pdfMoney(payment.emiMonthlyAmount || 0)}/mo`]]
        : []),
    ],
    theme: 'grid',
    styles: { fontSize: 9.5, cellPadding: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 110 },
      2: { fontStyle: 'bold', fillColor: [248, 250, 252], cellWidth: 110 },
    },
  });

  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Notes: ${payment.notes || 'Thank you for your business.'}`, 32, 340);
  doc.text('Computer-generated receipt — valid without signature.', 560, 380, { align: 'right' });

  doc.save(`${payment.receiptNumber}.pdf`);
}

export function exportReportPDF(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  settings: DealershipSettings
) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'landscape' });
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, 842, 64, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(`${settings.dealershipName} — ${title}`, 36, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, 806, 36, { align: 'right' });

  autoTable(doc, {
    startY: 84,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 9 },
    styles: { fontSize: 8.5, cellPadding: 6 },
  });

  doc.save(`${title.toLowerCase().replace(/\s+/g, '-')}.pdf`);
}

export function exportCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
