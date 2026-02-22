/**
 * Format a number as Indian Rupees (₹) with proper Indian numbering (1,23,456.78)
 */
export const formatCurrency = (
  value: number,
  options?: { minimumFractionDigits?: number; maximumFractionDigits?: number }
): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(value);
};

/**
 * Compact currency format for large values (e.g. ₹1.2L, ₹3.5Cr)
 */
export const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_00_00_000) {
    return `₹${(value / 1_00_00_000).toFixed(2)}Cr`;
  }
  if (value >= 1_00_000) {
    return `₹${(value / 1_00_000).toFixed(2)}L`;
  }
  return formatCurrency(value, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
