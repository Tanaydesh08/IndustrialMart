import { apiClient, apiData } from './client'

export const createCreditPayment = accountId => apiData(apiClient.post('/api/prototype/payments/credits', null, { params: { accountId } }))
export const createListingFeePayment = (accountId, listingId) => apiData(apiClient.post('/api/prototype/payments/listing-fee', null, { params: { accountId, listingId } }))
export const simulatePayment = (accountId, paymentId, success) => apiData(apiClient.post(`/api/prototype/payments/${encodeURIComponent(paymentId)}/simulate`, { success }, { params: { accountId } }))
