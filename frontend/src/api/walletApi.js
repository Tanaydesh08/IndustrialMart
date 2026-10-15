import { apiClient, apiData } from './client'

export const getWallet = accountId => apiData(apiClient.get('/api/prototype/wallet', { params: { accountId } }))
export const getCreditLedger = accountId => apiData(apiClient.get('/api/prototype/wallet/ledger', { params: { accountId } }))
