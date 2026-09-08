export const calculatePrice = (
  requestedEnergyKWh,
  travelDistanceKm,
  connectorType,
  chargingType,
  couponCode = null
) => {
  // Base rates
  const baseFare = 50; // Flat fee
  const energyRatePerKWh = chargingType === 'Fast' ? 25 : 15;
  const travelRatePerKm = 10;
  
  // Connectors
  let connectorFee = 0;
  if (connectorType === 'CCS2') connectorFee = 20;
  if (connectorType === 'CHAdeMO') connectorFee = 15;
  
  const energyCost = requestedEnergyKWh * energyRatePerKWh;
  const travelCharge = travelDistanceKm * travelRatePerKm;
  
  // Dynamic pricing (Night charge / Peak hour)
  const currentHour = new Date().getHours();
  let nightCharge = 0;
  let peakHourCharge = 0;
  
  if (currentHour >= 22 || currentHour <= 5) {
    nightCharge = 100;
  }
  
  if ((currentHour >= 8 && currentHour <= 11) || (currentHour >= 17 && currentHour <= 20)) {
    peakHourCharge = 50;
  }
  
  const serviceCharge = 30 + connectorFee;
  
  let subTotal = baseFare + energyCost + travelCharge + serviceCharge + nightCharge + peakHourCharge;
  
  // Coupons (mock implementation)
  let discount = 0;
  if (couponCode === 'VOLT50') {
    discount = 50;
  } else if (couponCode === 'FIRSTFREE') {
    discount = Math.min(subTotal, 200);
  }
  
  subTotal -= discount;
  if (subTotal < 0) subTotal = 0;
  
  const tax = subTotal * 0.18; // 18% GST
  const totalAmount = subTotal + tax;
  
  return {
    baseFare,
    energyCost,
    travelCharge,
    serviceCharge,
    nightCharge,
    peakHourCharge,
    discount,
    tax: parseFloat(tax.toFixed(2)),
    totalAmount: parseFloat(totalAmount.toFixed(2))
  };
};
