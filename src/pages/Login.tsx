import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

export function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!loading && session) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Wrong email or password.' : error.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold text-navy">Baro-Ai Referral Admin</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to manage referral codes</p>
        </div>
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 mb-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-gradient px-4 py-2.5 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
