import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { Skeleton, ErrorBanner } from '../components/Feedback'
import { Badge } from '../components/StatusBadge'
import { getPlanCatalog, getPlanCommissionSettings, setPlanCommission, ApiError } from '../lib/api'
import { formatMoney } from '../lib/format'
import type { PlanCatalogRow, PlanCommissionSetting } from '../types'

export function Plans() {
  const [plans, setPlans] = useState<PlanCatalogRow[] | null>(null)
  const [commission, setCommission] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [busyKey, setBusyKey] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getPlanCatalog(), getPlanCommissionSettings()])
      .then(([catalog, settings]: [PlanCatalogRow[], PlanCommissionSetting[]]) => {
        setPlans(catalog)
        setCommission(Object.fromEntries(settings.map((s) => [s.plan_key, s.commission_enabled])))
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  async function toggle(planKey: string) {
    const next = !commission[planKey]
    setBusyKey(planKey)
    setError(null)
    try {
      await setPlanCommission(planKey, next)
      setCommission((prev) => ({ ...prev, [planKey]: next }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <Layout>
      <h1 className="mb-2 text-2xl font-semibold text-navy">Plans</h1>
      <p className="mb-6 text-sm text-slate-500">
        "Earns commission" off means a student's first payment on that plan earns no referral commission for anyone.
      </p>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {!plans ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Active</th>
                <th className="px-5 py-3">Subscribers</th>
                <th className="px-5 py-3">Revenue</th>
                <th className="px-5 py-3">Earns commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.map((plan) => (
                <tr key={plan.plan_key} className="hover:bg-slate-50">
                  <td className="px-5 py-3 font-medium text-navy">{plan.label}</td>
                  <td className="px-5 py-3">{formatMoney(plan.amount_usd)}</td>
                  <td className="px-5 py-3">
                    <Badge color={plan.active ? 'green' : 'grey'} label={plan.active ? 'Active' : 'Inactive'} />
                  </td>
                  <td className="px-5 py-3">{plan.subscriber_count}</td>
                  <td className="px-5 py-3">{formatMoney(plan.revenue_usd)}</td>
                  <td className="px-5 py-3">
                    {plan.plan_key in commission ? (
                      <button
                        onClick={() => toggle(plan.plan_key)}
                        disabled={busyKey === plan.plan_key}
                        role="switch"
                        aria-checked={commission[plan.plan_key]}
                        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
                          commission[plan.plan_key] ? 'bg-brand-gradient' : 'bg-slate-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                            commission[plan.plan_key] ? 'translate-x-[22px]' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
