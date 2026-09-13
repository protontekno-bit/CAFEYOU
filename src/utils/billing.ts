/**
 * Utility functions for billing, currency formatting, and tax/service calculations
 */

export const formatRupiah = (amount: number): string => {
  return 'Rp ' + (amount || 0).toLocaleString('id-ID');
};

export interface TaxAndServiceResult {
  subtotal: number;
  taxRate: number;
  serviceRate: number;
  taxAmount: number;
  serviceAmount: number;
  roundingAmount: number;
  totalAmount: number;
}

export const calculateTaxAndService = (
  subtotal: number,
  isTaxIncluded: boolean = false,
  taxPercentage: number = 0,
  servicePercentage: number = 0,
  isCashRounding: boolean = false,
  enableTax: boolean = true
): TaxAndServiceResult => {
  const effectiveTax = enableTax !== false ? (taxPercentage || 0) : 0;
  const isTaxPlus = isTaxIncluded === false && effectiveTax > 0;
  const taxRate = isTaxPlus ? effectiveTax : 0;
  const serviceRate = servicePercentage > 0 ? servicePercentage : 0;

  const taxAmount = Math.round((subtotal * taxRate) / 100);
  const serviceAmount = Math.round((subtotal * serviceRate) / 100);
  let preliminaryTotal = subtotal + taxAmount + serviceAmount;

  let roundingAmount = 0;
  let totalAmount = preliminaryTotal;

  if (isCashRounding) {
    const rounded = Math.round(preliminaryTotal / 100) * 100;
    roundingAmount = rounded - preliminaryTotal;
    totalAmount = rounded;
  }

  return {
    subtotal,
    taxRate,
    serviceRate,
    taxAmount,
    serviceAmount,
    roundingAmount,
    totalAmount,
  };
};

export const isDrinkItem = (item: { category?: string; name?: string }): boolean => {
  const cat = (item.category || '').toUpperCase();
  if (
    cat.includes('KOPI') ||
    cat.includes('MINUM') ||
    cat.includes('DRINK') ||
    cat.includes('BEVERAGE') ||
    cat === 'NON_KOPI'
  ) {
    return true;
  }
  const n = (item.name || '').toLowerCase();

  // Kecualikan makanan yang mungkin memuat substring 'rice', 'steak', dsb
  if (
    n.includes('rice') ||
    n.includes('nasi') ||
    n.includes('steak') ||
    n.includes('goreng') ||
    n.includes('bakar') ||
    n.includes('mie') ||
    n.includes('ayam') ||
    n.includes('sapi') ||
    n.includes('kentang')
  ) {
    return false;
  }

  if (
    n.includes('kopi') ||
    n.includes('coffee') ||
    n.includes('americano') ||
    n.includes('espresso') ||
    n.includes('cappuccino') ||
    n.includes('latte') ||
    n.includes('mocha') ||
    n.includes('macchiato') ||
    n.includes('affogato') ||
    n.includes('frappe') ||
    n.includes('brew') ||
    /\b(tea|teh)\b/.test(n) ||
    n.includes('lemon tea') ||
    n.includes('green tea') ||
    n.includes('thai tea') ||
    n.includes('jus') ||
    n.includes('juice') ||
    n.includes('boba') ||
    n.includes('mocktail') ||
    n.includes('cocktail') ||
    n.includes('squash') ||
    n.includes('soda') ||
    /\b(es|ice|iced)\b/.test(n) ||
    n.includes('susu') ||
    n.includes('milk') ||
    n.includes('matcha') ||
    n.includes('taro') ||
    n.includes('chocolate') ||
    n.includes('cokelat') ||
    n.includes('mineral') ||
    n.includes('sirup') ||
    n.includes('syrup')
  ) {
    return true;
  }
  return false;
};
