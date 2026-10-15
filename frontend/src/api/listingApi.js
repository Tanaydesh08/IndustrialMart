import { apiClient, apiData } from './client'

export const getListings = (params, config = {}) => apiData(apiClient.get('/api/listings', { ...config, params }))
export const getListing = id => apiData(apiClient.get(`/api/listings/${encodeURIComponent(id)}`))
export const createListing = payload => apiData(apiClient.post('/api/listings', payload))
export const updateListing = (id, payload) => apiData(apiClient.put(`/api/listings/${encodeURIComponent(id)}`, payload))
export const deleteListing = id => apiData(apiClient.delete(`/api/listings/${encodeURIComponent(id)}`))
