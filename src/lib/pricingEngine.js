// Calculate pricing based on Hero-Agent schema
export function calculateOrderPricing(basePrice, addonTotal, hasPromo, paymentMethod = 'qris') {
  const discountRate = 0.20;
  const discountAmount = hasPromo ? basePrice * discountRate : 0;
  const discountedBase = basePrice - discountAmount;
  const subtotal = discountedBase + addonTotal;
  
  // Calculate raw service fee based on payment method
  let rawServiceFee = 0;
  let pgFeeRate = 0;
  
  if (paymentMethod === 'bank_transfer') {
    rawServiceFee = 4000;
  } else if (paymentMethod === 'gopay') {
    pgFeeRate = 0.02;
    rawServiceFee = subtotal * pgFeeRate;
  } else {
    pgFeeRate = 0.007;
    rawServiceFee = subtotal * pgFeeRate;
  }
  
  // Round up grand total to nearest hundred
  const grandTotal = Math.ceil((subtotal + rawServiceFee) / 100) * 100;
  const displayedServiceFee = grandTotal - subtotal;
  
  // Calculate sales commission (rounded down to nearest thousand)
  let commissionAmount = 0;
  if (hasPromo) {
    const rawCommission = discountedBase * 0.15;
    commissionAmount = Math.floor(rawCommission / 1000) * 1000;
  }

  // Calculate actual payment gateway fee
  const realPgFee = paymentMethod === 'bank_transfer' ? 4000 : grandTotal * pgFeeRate;

  // Calculate net revenue and margin discrepancies
  const companyNetRevenue = grandTotal - commissionAmount - realPgFee;
  const extraProfitFromCeil = displayedServiceFee - rawServiceFee;
  const extraProfitFromFloor = (hasPromo ? (discountedBase * 0.15) : 0) - commissionAmount;

  return {
    basePrice,
    discountAmount,
    discountedBase,
    addonTotal,
    subtotal,
    rawServiceFee,
    displayedServiceFee,
    grandTotal,
    commissionAmount,
    companyNetRevenue,
    metrics: {
      extraProfitFromCeil,
      extraProfitFromFloor,
      realPgFee
    }
  };
}
