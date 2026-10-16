import { apiClient, apiData } from './client'

export const unlockListing = listingId => apiData(apiClient.post(`/api/prototype/buyer/listings/${encodeURIComponent(listingId)}/unlock`))
export const getUnlockedListingDetails = listingId => apiData(apiClient.get(`/api/prototype/buyer/listings/${encodeURIComponent(listingId)}/details`))
export const getBuyerUnlocks = () => apiData(apiClient.get('/api/prototype/buyer/unlocks'))
