import api from './api'

export interface AuthResponse {
  user: {
    id: string
    name: string
    email: string
    role: string
    createdAt: string
  }
  token: string
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/register', { name, email, password })
  return data
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post('/auth/login', { email, password })
  return data
}

export async function refresh(): Promise<AuthResponse> {
  const { data } = await api.post('/auth/refresh')
  return data
}

export async function getMe(): Promise<AuthResponse['user']> {
  const { data } = await api.get('/auth/me')
  return data
}

// Decodifica el exp del JWT sin verificar firma (solo para timing)
export function getTokenExpiryMs(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}
