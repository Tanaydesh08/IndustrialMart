import { apiClient, apiData } from './client'

export const getModerationQueue = () => apiData(apiClient.get('/api/listings/moderation'))
export const moderateListing = (id, payload) => apiData(apiClient.put(`/api/listings/${encodeURIComponent(id)}/moderation`, payload))
