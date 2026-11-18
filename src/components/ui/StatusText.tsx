import { CheckCircle2, Clock, AlertTriangle, XCircle, CircleDot } from 'lucide-react';

interface StatusTextProps {
  status: string;
}

export function StatusText({ status }: StatusTextProps) {
  const s = status.toLowerCase();

  if (
    s === 'available' ||
    s === 'completed' ||
    s === 'paid' ||
    s === 'active' ||
    s === 'converted'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (
    s === 'reserved' ||
    s === 'confirmed' ||
    s === 'partially paid' ||
    s === 'scheduled' ||
    s === 'contacted' ||
    s === 'interested' ||
    s === 'test drive scheduled' ||
    s === 'on leave'
  ) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
        <CircleDot className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (s === 'pending' || s === 'under maintenance' || s === 'unpaid' || s === 'new') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (s === 'cancelled' || s === 'lost' || s === 'no-show' || s === 'inactive') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400 whitespace-nowrap">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  if (s === 'sold') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
      <span>{status}</span>
    </span>
  );
}
