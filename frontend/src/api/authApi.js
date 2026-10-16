import { apiClient, apiData } from './client'

export const register = payload => apiData(apiClient.post('/api/auth/register', payload))
export const login = payload => apiData(apiClient.post('/api/auth/login', payload))
