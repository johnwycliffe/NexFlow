// Metric & Manufacturing Formatters

export const formatMetric = (val, unit = 'units') => {
  if (val === undefined || val === null || isNaN(val)) return `0 ${unit}`;
  const formatted = Number(val).toLocaleString('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(val) ? 0 : 2
  });
  return `${formatted} ${unit}`;
};

export const formatCurrency = (val, currency = '$') => {
  if (val === undefined || val === null || isNaN(val)) return `${currency}0.00`;
  return `${currency}${Number(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return `${d.toISOString().split('T')[0]} ${d.toTimeString().substring(0, 5)}`;
  } catch {
    return dateString;
  }
};

export const getStatusVariant = (status) => {
  const s = String(status || '').toUpperCase();
  
  if (['COMPLETED', 'RELEASED', 'PASS', 'ACTIVE', 'IN_STOCK', 'RUNNING', 'ON_SCHEDULE', 'AVAILABLE'].includes(s)) {
    return 'success'; // Emerald
  }
  if (['IN_PROGRESS', 'IN_EXECUTION', 'SCHEDULED', 'INSPECTION', 'PENDING', 'PLANNED', 'PROCESSING'].includes(s)) {
    return 'primary'; // Blue
  }
  if (['WARNING', 'LOW_STOCK', 'DRAFT', 'UNDER_MAINTENANCE', 'MAINTENANCE', 'SHORTAGE_RISK', 'HOLD', 'IDLE'].includes(s)) {
    return 'warning'; // Amber
  }
  if (['REJECTED', 'FAIL', 'FAILED', 'OUT_OF_STOCK', 'CRITICAL', 'SHORTAGE', 'CANCELLED', 'OVERDUE', 'BLOCKED'].includes(s)) {
    return 'danger'; // Rose
  }
  return 'neutral'; // Slate
};

