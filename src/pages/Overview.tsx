import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { DateRangePicker, rangeFromKey } from '../components/DateRangePicker'
import { StatCard } from '../components/StatCard'
import { BarChart } from '../components/BarChart'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { getOverview, ApiError } from '../lib/api'
import { formatMoney } from '../lib/format'
import type { DateRange, Overview as OverviewData } from '../types'

export function Overview() {
  const [range, setRange] = useState<DateRange>(rangeFromKey('this_month'))
  const [data, setData] = useState<OverviewData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getOverview(range.from, range.to)
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

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Overview</h1>
        <DateRangePicker value={range} onChange={setRange} />
      </div>

      {error && <div className="mb-6"><ErrorBanner message={error} /></div>}

      {loading && !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            <StatCard label="Paying students" value={data.students.toLocaleString()} />
            <StatCard label="Money in" value={formatMoney(data.revenue_usd)} />
            <StatCard label="Commission earned" value={formatMoney(data.earned_usd)} />
            <StatCard label="Commission paid" value={formatMoney(data.paid_usd)} />
            <StatCard label="Commission owed" value={formatMoney(data.owed_usd)} highlight />
            <StatCard label="Active codes" value={data.active_codes.toLocaleString()} />
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 text-sm font-semibold text-navy">Paying students per day</h2>
            <BarChart data={data.daily.map((d) => ({ day: d.day, value: d.students }))} />
          </div>

          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy">Top codes</h2>
            </div>
            {data.top_codes.length === 0 ? (
              <div className="p-5">
                <EmptyState message="No codes have students yet in this range." />
              </div>
            ) : (
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Code</th>
                    <th className="px-5 py-3">Person</th>
                    <th className="px-5 py-3">Students</th>
                    <th className="px-5 py-3">Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.top_codes.map((c) => (
                    <tr key={c.code} className="hover:bg-slate-50">
                      <td className="px-5 py-3">
                        <Link to={`/codes/${c.code}`} className="font-mono font-medium text-brand-from hover:underline">
                          {c.code}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{c.person_name}</td>
                      <td className="px-5 py-3">{c.students}</td>
                      <td className="px-5 py-3">{formatMoney(c.earned_usd)}</td>
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
