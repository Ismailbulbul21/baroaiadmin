import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { isAdmin as fetchIsAdmin } from '../lib/api'

interface AuthState {
  loading: boolean
  session: Session | null
  isAdmin: boolean | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [sessionChecked, setSessionChecked] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [adminChecked, setAdminChecked] = useState(false)

  // This effect only ever calls plain React state setters inside the
  // onAuthStateChange callback. Calling any supabase.auth.* / supabase.rpc()
  // method from inside that callback deadlocks supabase-js v2 (it awaits the
  // same internal lock the event emission already holds) - so the admin
  // check runs in a separate effect below, triggered by `session` changing.
  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionChecked(true)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return
      setSession(newSession)
      setSessionChecked(true)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let active = true
    setAdminChecked(false)

    if (!session) {
      setIsAdmin(null)
      setAdminChecked(true)
      return
    }

    fetchIsAdmin()
      .then((result) => {
        if (active) setIsAdmin(result)
      })
      .catch(() => {
        if (active) setIsAdmin(false)
      })
      .finally(() => {
        if (active) setAdminChecked(true)
      })

    return () => {
      active = false
    }
  }, [session])

  async function signOut() {
    await supabase.auth.signOut()
  }

  const loading = !sessionChecked || !adminChecked

  return (
    <AuthContext.Provider value={{ loading, session, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
