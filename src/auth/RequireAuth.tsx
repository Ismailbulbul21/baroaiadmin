import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function RequireAuth({ children }: { children: ReactNode }) {
  const { loading, session, isAdmin, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f9fc]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-from" />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f9fc] px-6 text-center">
        <h1 className="text-xl font-semibold text-navy">This account has no admin access</h1>
        <p className="max-w-sm text-sm text-slate-500">
          Sign in with the admin account, or ask the owner to grant access.
        </p>
        <button
          onClick={() => signOut()}
          className="mt-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    )
  }

  return <>{children}</>
}
