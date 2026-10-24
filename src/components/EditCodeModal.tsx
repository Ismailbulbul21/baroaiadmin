import { useState } from 'react'
import { Modal } from './Modal'
import { updateCode, ApiError } from '../lib/api'
import type { CodeRow } from '../types'

export function EditCodeModal({
  code,
  onClose,
  onSaved,
}: {
  code: CodeRow
  onClose: () => void
  onSaved: (row: CodeRow) => void
}) {
  const [personName, setPersonName] = useState(code.person_name)
  const [personPhone, setPersonPhone] = useState(code.person_phone ?? '')
  const [percent, setPercent] = useState(String(code.percent))
  const [note, setNote] = useState(code.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    setError(null)
    if (!personName.trim()) {
      setError("Person's name is required.")
      return
    }
    const percentNum = Number(percent)
    if (!percent || Number.isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
      setError('Percent must be between 0 and 100.')
      return
    }
    setSubmitting(true)
    try {
      const row = await updateCode({
        code: code.code,
        personName: personName.trim(),
        personPhone: personPhone.trim() || null,
        percent: percentNum,
        note: note.trim() || null,
      })
      onSaved(row)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal title={`Edit ${code.code}`} onClose={onClose}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Person name</label>
          <input
            value={personName}
            onChange={(e) => setPersonName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Payout phone (optional)</label>
          <input
            value={personPhone}
            onChange={(e) => setPersonPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Percent</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={percent}
            onChange={(e) => setPercent(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-from focus:outline-none"
          />
          <p className="mt-1 text-xs text-slate-500">
            A new percent applies only to payments made after you save. Past earnings keep the percent they were made with.
          </p>
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
            {submitting ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
