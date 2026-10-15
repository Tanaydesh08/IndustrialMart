import { apiClient, apiData } from './client'

export const getCategories = () => apiData(apiClient.get('/api/categories'))
