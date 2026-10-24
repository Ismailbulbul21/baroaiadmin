import { useEffect, useState } from 'react'
import { Layout } from '../components/Layout'
import { DateRangePicker, rangeFromKey } from '../components/DateRangePicker'
import { StatCard } from '../components/StatCard'
import { BarChart } from '../components/BarChart'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { getRevenueOverview, ApiError } from '../lib/api'
import { formatMoney } from '../lib/format'
import type { DateRange, RevenueOverview as RevenueData } from '../types'

export function Revenue() {
  const [range, setRange] = useState<DateRange>(rangeFromKey('this_month'))
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getRevenueOverview(range.from, range.to)
      .then((result) => {
        if (active) setData(result)
      })
      .catch((err) => {
        if (active) setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [range])

  const successRate =
    data && data.successful_payments + data.failed_payments > 0
      ? Math.round((data.successful_payments / (data.successful_payments + data.failed_payments)) * 100)
      : null

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Revenue</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Revenue" value={formatMoney(data.revenue_usd)} highlight />
            <StatCard label="Successful payments" value={data.successful_payments.toLocaleString()} />
            <StatCard label="Failed payments" value={data.failed_payments.toLocaleString()} />
            <StatCard label="New subscriptions" value={data.new_subscriptions.toLocaleString()} />
          </div>
          {successRate !== null && (
            <p className="mt-2 text-sm text-slate-500">{successRate}% of payment attempts succeeded in this range.</p>
          )}

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-navy">Revenue per day</h2>
            <BarChart
              data={data.daily.map((d) => ({ day: d.day, value: d.revenue_usd }))}
              formatTooltipValue={formatMoney}
            />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">Revenue by plan</h2>
            </div>
            {data.by_plan.length === 0 ? (
              <div className="p-5">
                <EmptyState message="No successful payments in this range." />
              </div>
            ) : (
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Plan</th>
                    <th className="px-5 py-3">Successful payments</th>
                    <th className="px-5 py-3">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.by_plan.map((p) => (
                    <tr key={p.plan_key} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-medium">{p.label}</td>
                      <td className="px-5 py-3">{p.successful_payments}</td>
                      <td className="px-5 py-3">{formatMoney(p.revenue_usd)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </Layout>
  )
}
