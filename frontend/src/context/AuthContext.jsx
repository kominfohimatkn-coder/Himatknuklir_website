'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { api } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children, initialUser = undefined }) {
  const [user, setUser] = useState(initialUser ?? null)
  const [loading, setLoading] = useState(initialUser === undefined)

  useEffect(() => {
    if (initialUser !== undefined) {
      setLoading(false)
      return undefined
    }

    let active = true

    api('/api/auth/me')
      .then(data => {
        if (active) setUser(data.user || data)
      })
      .catch(() => {
        if (active) setUser(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [initialUser])

  const value = useMemo(
    () => ({
      user,
      loading,

      async login(username, password) {
        const data = await api('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            username,
            password,
          }),
        })

        const authenticatedUser = data.user || data

        setUser(authenticatedUser)

        return authenticatedUser
      },

      async logout() {
        await api('/api/auth/logout', {
          method: 'POST',
        })

        setUser(null)
      },
    }),
    [user, loading],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth harus berada di dalam AuthProvider',
    )
  }

  return context
}