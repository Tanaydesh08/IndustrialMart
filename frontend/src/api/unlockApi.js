import { apiClient, apiData } from './client'

export const createListingUnlockPayment = listingId => apiData(apiClient.post('/api/prototype/payments/listing-unlock', null, { params: { listingId } }))
export const simulatePayment = (paymentId, success) => apiData(apiClient.post(`/api/prototype/payments/${encodeURIComponent(paymentId)}/simulate`, { success }))
export const getUnlockedListingDetails = (listingId, config = {}) => apiData(apiClient.get(`/api/prototype/buyer/listings/${encodeURIComponent(listingId)}/details`, config))
export const getBuyerUnlocks = () => apiData(apiClient.get('/api/prototype/buyer/unlocks'))
