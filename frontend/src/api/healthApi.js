import { apiClient, apiData } from './client'

export const getHealth = () => apiData(apiClient.get('/api/health'))
