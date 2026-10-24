import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { RequireAuth } from './auth/RequireAuth'
import { Login } from './pages/Login'
import { Overview } from './pages/Overview'
import { Codes } from './pages/Codes'
import { CodeDetail } from './pages/CodeDetail'
import { Payouts } from './pages/Payouts'
import { Plans } from './pages/Plans'
import { Revenue } from './pages/Revenue'
import { Payments } from './pages/Payments'
import { Subscriptions } from './pages/Subscriptions'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Overview />
              </RequireAuth>
            }
          />
          <Route
            path="/codes"
            element={
              <RequireAuth>
                <Codes />
              </RequireAuth>
            }
          />
          <Route
            path="/codes/:code"
            element={
              <RequireAuth>
                <CodeDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/payouts"
            element={
              <RequireAuth>
                <Payouts />
              </RequireAuth>
            }
          />
          <Route
            path="/plans"
            element={
              <RequireAuth>
                <Plans />
              </RequireAuth>
            }
          />
          <Route
            path="/revenue"
            element={
              <RequireAuth>
                <Revenue />
              </RequireAuth>
            }
          />
          <Route
            path="/subscriptions"
            element={
              <RequireAuth>
                <Subscriptions />
              </RequireAuth>
            }
          />
          <Route
            path="/payments"
            element={
              <RequireAuth>
                <Payments />
              </RequireAuth>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
