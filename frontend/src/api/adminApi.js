import { apiClient, apiData } from './client'
export const getAdminDashboard = () => apiData(apiClient.get('/api/admin/dashboard'))
export const getAdminUsers = () => apiData(apiClient.get('/api/admin/users'))
export const getAdminListings = () => apiData(apiClient.get('/api/admin/listings'))
export const getSponsoredAds = () => apiData(apiClient.get('/api/admin/sponsored-ads'))
export const createSponsoredAd = payload => apiData(apiClient.post('/api/admin/sponsored-ads', payload))
export const updateSponsoredAd = (id,payload) => apiData(apiClient.put(`/api/admin/sponsored-ads/${id}`,payload))
export const deleteSponsoredAd = id => apiData(apiClient.delete(`/api/admin/sponsored-ads/${id}`))
export const getActiveSponsoredAds = () => apiData(apiClient.get('/api/sponsored-ads/active'))
export const uploadSponsoredImage = file => { const body=new FormData(); body.append('file',file); return apiData(apiClient.post('/api/admin/sponsored-ads/images',body,{headers:{'Content-Type':undefined}})) }
