import { apiClient, apiData } from './client'

export const createCreditPayment = () => apiData(apiClient.post('/api/prototype/payments/credits'))
export const createListingFeePayment = listingId => apiData(apiClient.post('/api/prototype/payments/listing-fee', null, { params: { listingId } }))
export const simulatePayment = (paymentId, success) => apiData(apiClient.post(`/api/prototype/payments/${encodeURIComponent(paymentId)}/simulate`, { success }))
