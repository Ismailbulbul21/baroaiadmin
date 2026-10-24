import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { DateRangePicker, rangeFromKey } from '../components/DateRangePicker'
import { SubscriptionStatusBadge } from '../components/StatusBadge'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { getSubscriptions, ApiError } from '../lib/api'
import { formatMoney, formatDate, formatDateTime } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import type { DateRange, SubscriptionRow, SubscriptionStatus } from '../types'

const STATUS_FILTERS: { key: SubscriptionStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'canceled', label: 'Canceled' },
]

export function Subscriptions() {
  const [range, setRange] = useState<DateRange>(rangeFromKey('all_time'))
  const [status, setStatus] = useState<SubscriptionStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [subs, setSubs] = useState<SubscriptionRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getSubscriptions(range.from, range.to, status === 'all' ? null : status)
      .then((rows) => {
        if (active) setSubs(rows)
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
  }, [range, status])

  const filtered = useMemo(() => {
    if (!subs) return []
    const q = search.trim().toLowerCase()
    if (!q) return subs
    return subs.filter((s) => (s.student_name ?? '').toLowerCase().includes(q))
  }, [subs, search])

  function exportCsv() {
    const headers = ['Created', 'Student', 'Phone', 'Plan', 'Amount', 'Source', 'Status', 'Starts', 'Ends', 'Canceled']
    const rows = filtered.map((s) => [
      formatDateTime(s.created_at),
      s.student_name ?? '',
      s.phone_masked ?? '',
      s.plan_label ?? '',
      s.amount_usd !== null ? s.amount_usd.toFixed(2) : '',
      s.source,
      s.status,
      formatDate(s.starts_at),
      formatDate(s.ends_at),
      s.canceled_at ? formatDate(s.canceled_at) : '',
    ])
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    downloadCsv(`baro-ai-subscriptions-${stamp}.csv`, headers, rows)
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Subscriptions</h1>
        <div className="flex flex-wrap items-center gap-2">
          <DateRangePicker value={range} onChange={setRange} />
          <button
            onClick={exportCsv}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatus(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                status === f.key
                  ? 'bg-brand-gradient text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {loading && !subs ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No subscriptions match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Starts</th>
                <th className="px-4 py-3">Ends</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    {s.student_name ?? '—'}
                    {s.phone_masked ? <span className="ml-1 text-slate-400">{s.phone_masked}</span> : null}
                  </td>
                  <td className="px-4 py-3">{s.plan_label ?? '—'}</td>
                  <td className="px-4 py-3">{s.amount_usd !== null ? formatMoney(s.amount_usd) : '—'}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{s.source}</td>
                  <td className="px-4 py-3"><SubscriptionStatusBadge status={s.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.starts_at)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(s.ends_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
