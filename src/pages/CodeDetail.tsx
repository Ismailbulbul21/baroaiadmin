import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { StatCard } from '../components/StatCard'
import { DateRangePicker, rangeFromKey } from '../components/DateRangePicker'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { ConfirmDialog } from '../components/Modal'
import { EditCodeModal } from '../components/EditCodeModal'
import { MarkPaidModal } from '../components/MarkPaidModal'
import {
  getCodes,
  getCodeRateHistory,
  getReferrals,
  getPayouts,
  setCodeStatus,
  deletePayout,
  ApiError,
} from '../lib/api'
import { formatMoney, formatDate, formatDateTime } from '../lib/format'
import { downloadCsv, safeFileNamePart } from '../lib/csv'
import { PAYOUT_METHOD_LABELS } from '../types'
import type { CodeRow, DateRange, PayoutRow, RateHistoryRow, ReferralRow } from '../types'

export function CodeDetail() {
  const { code: codeParam } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const code = (codeParam ?? '').toUpperCase()

  const [row, setRow] = useState<CodeRow | null>(null)
  const [history, setHistory] = useState<RateHistoryRow[]>([])
  const [payouts, setPayouts] = useState<PayoutRow[]>([])
  const [referrals, setReferrals] = useState<ReferralRow[] | null>(null)
  const [range, setRange] = useState<DateRange>(rangeFromKey('this_month'))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [showEdit, setShowEdit] = useState(false)
  const [confirmStop, setConfirmStop] = useState(false)
  const [statusBusy, setStatusBusy] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showMarkPaid, setShowMarkPaid] = useState(false)
  const [undoTarget, setUndoTarget] = useState<PayoutRow | null>(null)

  function loadHeader() {
    getCodes()
      .then((rows) => {
        const found = rows.find((r) => r.code === code) ?? null
        setRow(found)
        if (!found) setError('That code could not be found.')
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }

  function loadSideData() {
    getCodeRateHistory(code).then(setHistory).catch(() => {})
    getPayouts(code).then(setPayouts).catch(() => {})
  }

  function loadReferrals() {
    getReferrals(code, range.from, range.to)
      .then((rows) => {
        setReferrals(rows)
        setSelected(new Set())
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
  }

  useEffect(() => {
    setLoading(true)
    setError(null)
    Promise.all([
      getCodes().then((rows) => {
        const found = rows.find((r) => r.code === code) ?? null
        setRow(found)
        if (!found) throw new ApiError('That code could not be found.')
      }),
      getCodeRateHistory(code).then(setHistory),
      getPayouts(code).then(setPayouts),
      getReferrals(code, range.from, range.to).then(setReferrals),
    ])
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code])

  useEffect(() => {
    if (!loading) loadReferrals()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  const unpaidSelected = useMemo(
    () => (referrals ?? []).filter((r) => selected.has(r.id)),
    [referrals, selected],
  )

  async function handleSetStatus(status: 'active' | 'paused' | 'stopped') {
    setStatusBusy(true)
    setError(null)
    try {
      const updated = await setCodeStatus(code, status)
      setRow(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setStatusBusy(false)
      setConfirmStop(false)
    }
  }

  async function handleUndoPayout() {
    if (!undoTarget) return
    try {
      await deletePayout(undoTarget.id)
      setUndoTarget(null)
      loadHeader()
      loadSideData()
      loadReferrals()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
      setUndoTarget(null)
    }
  }

  function exportCsv() {
    if (!referrals || !row) return
    const headers = ['Date', 'Student', 'Phone', 'Plan', 'Amount', 'Percent', 'Commission', 'Status', 'Paid on']
    const rows = referrals.map((r) => [
      formatDate(r.created_at),
      r.student_name ?? '',
      r.phone_masked ?? '',
      r.plan_label,
      r.amount_usd.toFixed(2),
      r.percent,
      r.commission_usd.toFixed(2),
      r.payout_id ? 'Paid' : 'Unpaid',
      r.paid_at ? formatDate(r.paid_at) : '',
    ])
    const now = new Date()
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    downloadCsv(`baro-ai-referrals-${safeFileNamePart(row.person_name)}-${stamp}.csv`, headers, rows)
  }

  if (loading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-40" />
        </div>
      </Layout>
    )
  }

  if (error && !row) {
    return (
      <Layout>
        <ErrorBanner message={error} />
      </Layout>
    )
  }

  if (!row) return null

  return (
    <Layout>
      <button onClick={() => navigate('/codes')} className="mb-4 text-sm text-slate-500 hover:text-slate-700">
        ← Back to codes
      </button>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl font-semibold text-navy">{row.code}</h1>
              <StatusBadge status={row.status} />
            </div>
            <p className="mt-1 text-sm text-slate-600">
              {row.person_name}
              {row.person_phone ? ` · ${row.person_phone}` : ''} · {row.percent}%
            </p>
            {row.note && <p className="mt-1 text-sm text-slate-500">{row.note}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
            {row.status === 'active' && (
              <button
                disabled={statusBusy}
                onClick={() => handleSetStatus('paused')}
                className="rounded-lg border border-amber-300 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-50"
              >
                Pause
              </button>
            )}
            {row.status === 'paused' && (
              <button
                disabled={statusBusy}
                onClick={() => handleSetStatus('active')}
                className="rounded-lg border border-emerald-300 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
              >
                Resume
              </button>
            )}
            {row.status !== 'stopped' && (
              <button
                disabled={statusBusy}
                onClick={() => setConfirmStop(true)}
                className="rounded-lg border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Stop
              </button>
            )}
          </div>
        </div>

        {error && <div className="mt-4"><ErrorBanner message={error} /></div>}

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="Students" value={row.students.toLocaleString()} />
          <StatCard label="Money in" value={formatMoney(row.revenue_usd)} />
          <StatCard label="Earned" value={formatMoney(row.earned_usd)} />
          <StatCard label="Paid" value={formatMoney(row.paid_usd)} />
          <StatCard label="Owed" value={formatMoney(row.owed_usd)} highlight />
        </div>
      </div>

      {history.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-semibold text-navy">Percent history</h2>
          </div>
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-5 py-2.5">Date</th>
                <th className="px-5 py-2.5">Old %</th>
                <th className="px-5 py-2.5">New %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((h, i) => (
                <tr key={i}>
                  <td className="px-5 py-2.5 text-slate-500">{formatDateTime(h.changed_at)}</td>
                  <td className="px-5 py-2.5">{h.old_percent}%</td>
                  <td className="px-5 py-2.5">{h.new_percent}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mb-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-navy">Students</h2>
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

        {unpaidSelected.length > 0 && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-brand-gradient px-4 py-2.5 text-sm text-white">
            <span>{unpaidSelected.length} selected</span>
            <button
              onClick={() => setShowMarkPaid(true)}
              className="rounded-md bg-white/15 px-3 py-1.5 font-medium hover:bg-white/25"
            >
              Mark selected as paid
            </button>
          </div>
        )}

        {!referrals ? (
          <Skeleton className="h-32" />
        ) : referrals.length === 0 ? (
          <EmptyState message="No students yet for this code." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[880px] text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3"></th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Plan</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">%</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      {!r.payout_id && (
                        <input
                          type="checkbox"
                          checked={selected.has(r.id)}
                          onChange={(e) => {
                            setSelected((prev) => {
                              const next = new Set(prev)
                              if (e.target.checked) next.add(r.id)
                              else next.delete(r.id)
                              return next
                            })
                          }}
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatDate(r.created_at)}</td>
                    <td className="px-4 py-3">
                      {r.student_name ?? '—'}
                      {r.phone_masked ? <span className="ml-1 text-slate-400">{r.phone_masked}</span> : null}
                    </td>
                    <td className="px-4 py-3">{r.plan_label}</td>
                    <td className="px-4 py-3">{formatMoney(r.amount_usd)}</td>
                    <td className="px-4 py-3">{r.percent}%</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(r.commission_usd)}</td>
                    <td className="px-4 py-3">
                      {r.payout_id ? (
                        <span className="text-emerald-700">Paid {formatDate(r.paid_at)}</span>
                      ) : (
                        <span className="text-slate-500">Unpaid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold text-navy">Payouts</h2>
        {payouts.length === 0 ? (
          <EmptyState message="No payouts yet for this code." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Students</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payouts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-500">{formatDate(p.paid_at)}</td>
                    <td className="px-4 py-3 font-medium">{formatMoney(p.amount_usd)}</td>
                    <td className="px-4 py-3">{PAYOUT_METHOD_LABELS[p.method]}</td>
                    <td className="px-4 py-3 text-slate-500">{p.reference ?? '—'}</td>
                    <td className="px-4 py-3">{p.referral_count}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setUndoTarget(p)}
                        className="text-sm font-medium text-red-600 hover:underline"
                      >
                        Undo
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showEdit && (
        <EditCodeModal
          code={row}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setRow(updated)
            setShowEdit(false)
            loadSideData()
          }}
        />
      )}

      {confirmStop && (
        <ConfirmDialog
          title="Stop this code?"
          message="Stopped codes cannot be turned back on. The code's history stays, but it can never be resumed."
          confirmLabel="Stop code"
          danger
          onConfirm={() => handleSetStatus('stopped')}
          onCancel={() => setConfirmStop(false)}
        />
      )}

      {showMarkPaid && (
        <MarkPaidModal
          code={code}
          referrals={unpaidSelected}
          onClose={() => setShowMarkPaid(false)}
          onSaved={() => {
            setShowMarkPaid(false)
            loadHeader()
            loadSideData()
            loadReferrals()
          }}
        />
      )}

      {undoTarget && (
        <ConfirmDialog
          title="Undo this payout?"
          message="This will mark those students' commissions as unpaid again."
          confirmLabel="Undo payout"
          danger
          onConfirm={handleUndoPayout}
          onCancel={() => setUndoTarget(null)}
        />
      )}
    </Layout>
  )
}
