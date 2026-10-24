import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/Layout'
import { StatusBadge } from '../components/StatusBadge'
import { Skeleton, ErrorBanner, EmptyState } from '../components/Feedback'
import { NewCodeModal } from '../components/NewCodeModal'
import { getCodes, ApiError } from '../lib/api'
import { formatMoney, formatDate } from '../lib/format'
import type { CodeRow, CodeStatus } from '../types'

const STATUS_FILTERS: { key: CodeStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'paused', label: 'Paused' },
  { key: 'stopped', label: 'Stopped' },
]

export function Codes() {
  const [codes, setCodes] = useState<CodeRow[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CodeStatus | 'all'>('all')
  const [showNewModal, setShowNewModal] = useState(false)

  function load() {
    setLoading(true)
    setError(null)
    getCodes()
      .then(setCodes)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Something went wrong.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!codes) return []
    const q = search.trim().toLowerCase()
    return codes.filter((c) => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false
      if (!q) return true
      return c.code.toLowerCase().includes(q) || c.person_name.toLowerCase().includes(q)
    })
  }, [codes, search, statusFilter])

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Codes</h1>
        <button
          onClick={() => setShowNewModal(true)}
          className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white"
        >
          New code
        </button>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search code or person…"
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
        />
        <div className="flex gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                statusFilter === f.key
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

      {loading && !codes ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState message={codes?.length === 0 ? 'No codes yet. Create your first one.' : 'No codes match your filters.'} />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full min-w-[920px] text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-xs font-medium uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Person</th>
                <th className="px-4 py-3">Percent</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Students</th>
                <th className="px-4 py-3">Earned</th>
                <th className="px-4 py-3">Paid</th>
                <th className="px-4 py-3">Owed</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <tr key={c.code} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link to={`/codes/${c.code}`} className="font-mono font-medium text-brand-from hover:underline">
                      {c.code}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{c.person_name}</td>
                  <td className="px-4 py-3">{c.percent}%</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3">{c.students}</td>
                  <td className="px-4 py-3">{formatMoney(c.earned_usd)}</td>
                  <td className="px-4 py-3">{formatMoney(c.paid_usd)}</td>
                  <td className="px-4 py-3 font-medium text-brand-from">{formatMoney(c.owed_usd)}</td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNewModal && (
        <NewCodeModal
          onClose={() => setShowNewModal(false)}
          onCreated={() => {
            setShowNewModal(false)
            load()
          }}
        />
      )}
    </Layout>
  )
}
