import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { getPayouts, ApiError } from '../lib/api'
import { formatMoney, formatDate, monthLabel } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import { PAYOUT_METHOD_LABELS } from '../types'
import type { PayoutRow } from '../types'

export function Payouts() {
  const [payouts, setPayouts] = useState<PayoutRow[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [month, setMonth] = useState<string>('all')

  useEffect(() => {
    getPayouts(null)
      .then(setPayouts)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }, [])

  const months = useMemo(() => {
    if (!payouts) return []
    const set = new Set(payouts.map((p) => p.paid_at.slice(0, 7)))
    return Array.from(set).sort().reverse()
  }, [payouts])

  const filtered = useMemo(() => {
    if (!payouts) return []
    if (month === 'all') return payouts
    return payouts.filter((p) => p.paid_at.slice(0, 7) === month)
  }, [payouts, month])

  function exportCsv() {
    const headers = ['Date', 'Code', 'Person', 'Amount', 'Method', 'Reference', 'Students', 'Note']
    const rows = filtered.map((p) => [
      formatDate(p.paid_at),
      p.code,
      p.person_name,
      p.amount_usd.toFixed(2),
      PAYOUT_METHOD_LABELS[p.method],
      p.reference ?? '',
      p.referral_count,
      p.note ?? '',
    ])
    const label = month === 'all' ? 'ALL' : month
    downloadCsv(`baro-ai-referrals-PAYOUTS-${label}.csv`, headers, rows)
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Payouts</h1>
        <div className="flex items-center gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          >
            <option value="all">All months</option>
            {months.map((m) => (
              <option key={m} value={m}>
                {monthLabel(`${m}-01`)}
              </option>
            ))}
          </select>
          <button
            onClick={exportCsv}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <div className="mb-4"><ErrorBanner message={error} /></div>}

      {!payouts ? (
        <Skeleton className="h-40" />
      ) : filtered.length === 0 ? (
        <EmptyState message="No payouts yet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500">{formatDate(p.paid_at)}</td>
                  <td className="px-4 py-3">
                    <Link to={`/codes/${p.code}`} className="font-mono font-medium text-brand-from hover:underline">
                      {p.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{p.person_name}</td>
                  <td className="px-4 py-3 font-medium">{formatMoney(p.amount_usd)}</td>
                  <td className="px-4 py-3">{PAYOUT_METHOD_LABELS[p.method]}</td>
                  <td className="px-4 py-3 text-slate-500">{p.reference ?? '—'}</td>
                  <td className="px-4 py-3">{p.referral_count}</td>
                  <td className="px-4 py-3 text-slate-500">{p.note ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  )
}
