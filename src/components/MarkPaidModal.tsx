import { useState } from 'react'
import { Modal } from './Modal'
import { createPayout, ApiError } from '../lib/api'
import { formatMoney, todayEatIso } from '../lib/format'
import { PAYOUT_METHOD_LABELS } from '../types'
import type { PayoutMethod, ReferralRow } from '../types'

export function MarkPaidModal({
  code,
  referrals,
  onClose,
  onSaved,
}: {
  code: string
  referrals: ReferralRow[]
  onClose: () => void
  onSaved: () => void
}) {
  const total = referrals.reduce((sum, r) => sum + r.commission_usd, 0)
  const [paidAt, setPaidAt] = useState(todayEatIso())
  const [method, setMethod] = useState<PayoutMethod>('evc')
  const [reference, setReference] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await createPayout({
        code,
        referralIds: referrals.map((r) => r.id),
        paidAt,
        method,
        reference: reference.trim() || null,
        note: note.trim() || null,
      })
      onSaved()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title="Mark selected as paid" onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2.5">
          <p className="text-xs text-slate-500">Total ({referrals.length} students)</p>
          <p className="text-lg font-semibold text-navy">{formatMoney(total)}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Paid on</label>
          <input
            type="date"
            value={paidAt}
            onChange={(e) => setPaidAt(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Method</label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value as PayoutMethod)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          >
            {Object.entries(PAYOUT_METHOD_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Reference (optional)</label>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Transaction ID"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Mark as paid'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
