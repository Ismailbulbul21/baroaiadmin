import { endOfMonthEat, startOfMonthEat, last7DaysRange } from '../lib/format'
import type { DateRange, DateRangeKey } from '../types'

const OPTIONS: { key: DateRangeKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'last_7_days', label: 'Last 7 days' },
  { key: 'all_time', label: 'All time' },
  { key: 'custom', label: 'Custom' },
]

export function rangeFromKey(key: DateRangeKey, customFrom?: string, customTo?: string): DateRange {
  switch (key) {
    case 'this_month':
      return { key, from: startOfMonthEat(0), to: endOfMonthEat(0) }
    case 'last_month':
      return { key, from: startOfMonthEat(1), to: endOfMonthEat(1) }
    case 'last_7_days': {
      const { from, to } = last7DaysRange()
      return { key, from, to }
    }
    case 'all_time':
      return { key, from: null, to: null }
    case 'custom':
      return { key, from: customFrom ?? null, to: customTo ?? null }
  }
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange
  onChange: (range: DateRange) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(rangeFromKey(opt.key, value.from ?? undefined, value.to ?? undefined))}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            value.key === opt.key
              ? 'bg-brand-gradient text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {opt.label}
        </button>
      ))}
      {value.key === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={value.from ?? ''}
            onChange={(e) => onChange({ ...value, from: e.target.value || null })}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            value={value.to ?? ''}
            onChange={(e) => onChange({ ...value, to: e.target.value || null })}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
          />
        </div>
      )}
    </div>
  )
}
