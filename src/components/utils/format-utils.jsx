export function formatCurrency(amount, locale = 'en-US', currency = 'USD') {
  if (amount === undefined || amount === null) return '$0.00';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function cn(...inputs) {
  return inputs.filter(Boolean).join(" ");
}