/**
 * NexFlow ERP - Centralized Design System Entry Point
 */

import { tokens } from './tokens';
export { tokens };

/**
 * Maps semantic status strings to standardized token objects.
 * Supports all 20 modules (Orders, Inventory, QA, Machines, MRP, Shifts).
 */
export const getStatusToken = (status) => {
  const fallback = tokens?.colors?.status?.neutral || {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400'
  };

  if (!status) return fallback;
  const s = String(status).toUpperCase();

  // Completed / Healthy / Passed
  if (['COMPLETED', 'PASSED', 'PASS', 'IN_STOCK', 'BALANCED', 'ACTIVE', 'HEALTHY', 'RUNNING'].includes(s)) {
    return tokens?.colors?.status?.success || fallback;
  }
  // Warning / Reorder / Low
  if (['PENDING', 'PENDING_PLANNING', 'WARNING', 'LOW_STOCK', 'REORDER', 'REORDER_RECOMMENDED', 'IDLE'].includes(s)) {
    return tokens?.colors?.status?.warning || fallback;
  }
  // Critical / Rejected / Shortage / Blocked
  if (['REJECTED', 'FAIL', 'FAILED', 'OUT_OF_STOCK', 'CRITICAL_SHORTAGE', 'SHORTAGE', 'ERROR', 'STOPPED', 'CONFLICT'].includes(s)) {
    return tokens?.colors?.status?.danger || fallback;
  }
  // In-Progress / Released
  if (['IN_PROGRESS', 'IN-PROGRESS', 'RELEASED', 'IN_PRODUCTION', 'PROCESSING', 'SCHEDULED', 'INSPECTION'].includes(s)) {
    return tokens?.colors?.status?.info || fallback;
  }
  // Purple (Special crews / shifts / calibration)
  if (['CALIBRATION', 'MAINTENANCE', 'NIGHT'].includes(s)) {
    return tokens?.colors?.status?.purple || fallback;
  }

  return tokens?.colors?.status?.neutral || fallback;
};

/**
 * Standard CSS classes for core layout & UI primitives
 */
export const DS_CLASSES = {
  card: 'bg-white rounded-xl border border-slate-200 shadow-2xs transition-all hover:shadow-xs',
  cardHeader: 'px-5 py-4 border-b border-slate-100 flex items-center justify-between',
  cardBody: 'p-5',
  tableHeader: 'px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200 select-none',
  tableCell: 'px-4 py-3.5 text-sm text-slate-700 border-b border-slate-100 whitespace-nowrap',
  tableRowHover: 'hover:bg-slate-50/70 transition-colors',
  inputBase: 'w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500 border-slate-300 hover:border-slate-400 shadow-2xs',
  inputError: 'border-rose-300 focus:ring-rose-500 focus:border-rose-400 text-rose-900',
  focusRing: 'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1',
};

