export const paiseToRupees = amountPaise => Number(amountPaise || 0) / 100
export const formatINR = amount => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(Number(amount || 0))
