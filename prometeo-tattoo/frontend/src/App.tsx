import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthStore } from './store/authStore'
import { refresh, getTokenExpiryMs } from './services/authService'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export default function App() {
  const { token, setAuth } = useAuthStore()

  useEffect(() => {
    if (!token) return
    const expiryMs = getTokenExpiryMs(token)
    if (!expiryMs) return
    const msLeft = expiryMs - Date.now()
    // Token ya expirado o próximo a expirar → renovar silenciosamente
    if (msLeft < TWO_DAYS_MS) {
      refresh()
        .then(({ user, token: newToken }) => setAuth(user, newToken))
        .catch(() => {
          // Token inválido → el interceptor de axios se encargará del logout en el próximo request
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return <RouterProvider router={router} />
}
