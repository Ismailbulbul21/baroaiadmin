import { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/Layout'
import { DateRangePicker, rangeFromKey } from '../components/DateRangePicker'
import { OutcomeBadge } from '../components/StatusBadge'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { getPayments, ApiError } from '../lib/api'
import { formatMoney, formatDateTime } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import type { DateRange, PaymentOutcome, PaymentRow } from '../types'

const OUTCOME_FILTERS: { key: PaymentOutcome | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'approved', label: 'Approved' },
  { key: 'declined', label: 'Declined' },
]

export function Payments() {
  const [range, setRange] = useState<DateRange>(rangeFromKey('this_month'))
  const [outcome, setOutcome] = useState<PaymentOutcome | 'all'>('all')
  const [search, setSearch] = useState('')
  const [payments, setPayments] = useState<PaymentRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)
    getPayments(range.from, range.to, outcome === 'all' ? null : outcome)
      .then((rows) => {
        if (active) setPayments(rows)
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
  }, [range, outcome])

  const filtered = useMemo(() => {
    if (!payments) return []
    const q = search.trim().toLowerCase()
    if (!q) return payments
    return payments.filter(
      (p) =>
        (p.student_name ?? '').toLowerCase().includes(q) ||
        (p.reference_id ?? '').toLowerCase().includes(q) ||
        (p.transaction_id ?? '').toLowerCase().includes(q),
    )
  }, [payments, search])

  function exportCsv() {
    const headers = [
      'Date', 'Student', 'Phone', 'Plan', 'Amount', 'Wallet', 'Outcome',
      'Response code', 'Error code', 'Message', 'Reference', 'Transaction ID', 'Referral code',
    ]
    const rows = filtered.map((p) => [
      formatDateTime(p.created_at),
      p.student_name ?? '',
      p.phone_masked ?? '',
      p.plan_label ?? '',
      p.amount_usd !== null ? p.amount_usd.toFixed(2) : '',
      p.wallet ?? '',
      p.outcome,
      p.response_code ?? '',
      p.error_code ?? '',
      p.provider_message ?? '',
      p.reference_id ?? '',
      p.transaction_id ?? '',
      p.referral_code ?? '',
    ])
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    downloadCsv(`baro-ai-payments-${stamp}.csv`, headers, rows)
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Payments</h1>
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
          placeholder="Search student or reference…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
        />
        <div className="flex gap-2">
          {OUTCOME_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setOutcome(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                outcome === f.key
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

      {loading && !payments ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No payments match your filters." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[1040px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Wallet</th>
                <th className="px-4 py-3">Outcome</th>
                <th className="px-4 py-3">Error</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDateTime(p.created_at)}</td>
                  <td className="px-4 py-3">
                    {p.student_name ?? '—'}
                    {p.phone_masked ? <span className="ml-1 text-slate-400">{p.phone_masked}</span> : null}
                  </td>
                  <td className="px-4 py-3">{p.plan_label ?? '—'}</td>
                  <td className="px-4 py-3">{p.amount_usd !== null ? formatMoney(p.amount_usd) : '—'}</td>
                  <td className="px-4 py-3 uppercase text-slate-500">{p.wallet ?? '—'}</td>
                  <td className="px-4 py-3"><OutcomeBadge outcome={p.outcome} /></td>
                  <td className="px-4 py-3 text-slate-500">{p.error_code ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500">{p.reference_id ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
