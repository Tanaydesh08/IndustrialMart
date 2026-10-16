import { apiClient, apiData } from './client'

export const getWallet = () => apiData(apiClient.get('/api/prototype/wallet'))
export const getCreditLedger = () => apiData(apiClient.get('/api/prototype/wallet/ledger'))
