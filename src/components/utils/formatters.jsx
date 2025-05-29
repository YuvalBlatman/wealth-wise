// Format currency with proper Hebrew locale support
export function formatCurrency(amount, currency = 'ILS') {
  if (amount === null || amount === undefined) return '-';
  
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(amount);
}

// Format date to Hebrew locale
export function formatDate(date) {
  if (!date) return '-';
  
  const d = new Date(date);
  return d.toLocaleDateString('he-IL');
}

// Format number with comma separators
export function formatNumber(num) {
  if (num === null || num === undefined) return '-';
  
  return new Intl.NumberFormat('he-IL').format(num);
}

// Format percentage
export function formatPercent(value) {
  if (value === null || value === undefined) return '-';
  
  return new Intl.NumberFormat('he-IL', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(value / 100);
}

// Get category name in Hebrew
export function getCategoryNameHebrew(category) {
  const categories = {
    'real_estate': 'נדל״ן',
    'financial': 'מכשירים פיננסיים',
    'savings': 'חסכונות ופקדונות',
    'pension': 'פנסיה וביטוח',
    'alternative': 'נכסים אלטרנטיביים'
  };
  
  return categories[category] || category;
}

// Get category icon
export function getCategoryIcon(category) {
  const icons = {
    'real_estate': 'Building',
    'financial': 'BarChartHorizontal',
    'savings': 'PiggyBank',
    'pension': 'Heart',
    'alternative': 'Gem'
  };
  
  return icons[category] || 'CircleDot';
}

// Get currency symbol
export function getCurrencySymbol(currency = 'ILS') {
  const symbols = {
    'ILS': '₪',
    'USD': '$',
    'EUR': '€',
    'GBP': '£'
  };
  
  return symbols[currency] || currency;
}