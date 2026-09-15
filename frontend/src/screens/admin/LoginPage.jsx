'use client'

import { useState } from 'react'
import {
  Navigate,
  useNavigate,
} from '@/lib/react-router-dom-shim'

import { useAuth } from '../../context/AuthContext'
import { getDefaultAdminPath } from '../../lib/adminPermissions'

export default function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    username: '',
    password: '',
  })

  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (user) {
    return (
      <Navigate
        to={getDefaultAdminPath(user)}
        replace
      />
    )
  }

  function updateField(event) {
    const { name, value } = event.target

    setForm(current => ({
      ...current,
      [name]: value,
    }))
  }

  async function submit(event) {
    event.preventDefault()

    if (busy) return

    setBusy(true)
    setError('')

    try {
      const authenticatedUser = await login(
        form.username.trim(),
        form.password,
      )

      navigate(getDefaultAdminPath(authenticatedUser), {
        replace: true,
      })
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Login gagal. Periksa username dan password.',
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-nuclear-50 px-4 py-10">
      <div className="absolute inset-0 bg-grid bg-[length:32px_32px]" />

      <section className="relative w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-soft sm:p-10">
        <header className="text-center">

          <h1 className="mt-5 text-2xl font-extrabold text-slate-950">
            Admin Login
          </h1>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-slate-400">
            Poltek Nuklir BRIN
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold leading-5 text-rose-700"
          >
            {error}
          </div>
        )}

        <form
          onSubmit={submit}
          className="mt-7 space-y-5"
        >
          <div>
            <label
              htmlFor="username"
              className="label"
            >
              Username
            </label>

            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className="field"
              value={form.username}
              onChange={updateField}
              required
              autoFocus
              disabled={busy}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="label"
            >
              Password
            </label>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className="field pr-10"
                value={form.password}
                onChange={updateField}
                required
                disabled={busy}
              />

              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-nuclear-500"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                disabled={busy}
              >
                {showPassword ? (
                  // Icon mata “slash” (sembunyikan)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                    />
                  </svg>
                ) : (
                  // Icon mata (tampilkan)
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-primary w-full"
            disabled={busy}
          >
            {busy
              ? 'Memverifikasi…'
              : 'Masuk Sistem'}
          </button>
        </form>

        <a
          href="/"
          className="mt-7 block text-center text-xs font-semibold text-slate-400 transition hover:text-nuclear-800"
        >
          ← Kembali ke halaman publik
        </a>
      </section>
    </main>
  )
}