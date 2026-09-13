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
  isCashRounding: boolean = false
): TaxAndServiceResult => {
  const isTaxPlus = isTaxIncluded === false && taxPercentage > 0;
  const taxRate = isTaxPlus ? taxPercentage : 0;
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
