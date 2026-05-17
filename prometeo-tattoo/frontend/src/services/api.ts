import axios from 'axios'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // En 401, intentar refresh una sola vez (no reintentar si el refresh mismo falla)
    if (error.response?.status === 401 && !originalRequest._retried && !isRefreshing) {
      const token = useAuthStore.getState().token
      if (token) {
        originalRequest._retried = true
        isRefreshing = true
        try {
          const { data } = await axios.post(
            `${originalRequest.baseURL ?? (import.meta.env.VITE_API_URL || 'http://localhost:4000/api')}/auth/refresh`,
            {},
            { headers: { Authorization: `Bearer ${token}` } },
          )
          useAuthStore.getState().setAuth(data.user, data.token)
          originalRequest.headers.Authorization = `Bearer ${data.token}`
          return api(originalRequest)
        } catch {
          useAuthStore.getState().logout()
        } finally {
          isRefreshing = false
        }
      } else {
        useAuthStore.getState().logout()
      }
    }

    const responseData = error.response?.data
    const message = responseData?.message || error.message || 'Error de conexión'
    const apiError = Object.assign(new Error(message), {
      errors: responseData?.errors as Record<string, string> | undefined,
      statusCode: error.response?.status as number | undefined,
    })
    return Promise.reject(apiError)
  },
)

export default api
