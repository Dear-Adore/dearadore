// Paket katalog & komisi sales (sumber kebenaran tunggal untuk dashboard /sales).
export const SALES_DISCOUNT_PERCENT = 20;

export const SALES_PACKAGES = [
  { id: 'basic', name: 'Basic', price: 127000, commission: 15000 },
  { id: 'premium', name: 'Premium', price: 199000, commission: 23000 },
  { id: 'exclusive', name: 'Exclusive', price: 255000, commission: 30000 },
];

export const FALLBACK_COMMISSION = SALES_PACKAGES[0].commission;

export function calcSalesPrice(catalogPrice) {
  const discount = Math.floor(catalogPrice * (SALES_DISCOUNT_PERCENT / 100));
  return { discount, total: catalogPrice - discount };
}
