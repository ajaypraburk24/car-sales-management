export function formatCurrency(amount: number, symbol = '₹'): string {
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
  })}`;
}

export function formatCompactCurrency(amount: number, symbol = '₹'): string {
  const num = Number(amount || 0);
  if (Math.abs(num) >= 10000000) {
    return `${symbol}${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `${symbol}${(num / 100000).toFixed(2)} L`;
  }
  return formatCurrency(num, symbol);
}

export function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function hasPermission(permissions: string[] | undefined, required: string): boolean {
  if (!permissions) return false;
  if (permissions.includes('*')) return true;
  return permissions.includes(required);
}
