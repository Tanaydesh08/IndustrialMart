import axios from 'axios'

export class ApiError extends Error {
  constructor(message, status = 0, code = 'API_ERROR') {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

function friendlyMessage(error) {
  const status = error.response?.status
  const body = error.response?.data
  const candidate = body?.message || body?.detail
  const backendMessage = typeof candidate === 'string' && candidate.length < 240 ? candidate : ''
  if (!status) return 'The Industrial Mart API is unreachable. Check that the backend is running at the configured URL.'
  if (status === 400) return backendMessage || 'Some fields are invalid. Review the form and try again.'
  if (status === 401) return 'The API requires authentication, which this backend prototype does not currently provide.'
  if (status === 403) return 'The backend denied this action.'
  if (status === 404) return backendMessage || 'The requested record was not found.'
  if (status === 409 && /until.*listing fee.*paid/i.test(backendMessage)) return 'The listing fee must be successfully simulated before moderation can approve this listing.'
  if (status === 409) return backendMessage || 'This action conflicts with the current record or payment status.'
  if (status >= 500) return 'The backend could not complete the request. Please try again.'
  return backendMessage || 'The request could not be completed.'
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
  timeout: 10000,
})

apiClient.interceptors.response.use(
  response => response,
  error => Promise.reject(new ApiError(friendlyMessage(error), error.response?.status || 0, error.code || 'API_ERROR')),
)

export async function apiData(request) {
  const response = await request
  return response.status === 204 ? null : response.data
}
