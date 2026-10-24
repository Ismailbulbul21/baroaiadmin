import { formatDate } from '../lib/format'

export function BarChart({
  data,
  formatTooltipValue = (v) => String(v),
}: {
  data: { day: string; value: number }[]
  formatTooltipValue?: (value: number) => string
}) {
  if (data.length === 0) {
    return <p className="text-sm text-slate-500">No data in this range.</p>
  }

  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex h-40 items-end gap-1 overflow-x-auto">
      {data.map((d) => (
        <div key={d.day} className="group relative flex flex-1 min-w-[6px] flex-col items-center justify-end">
          <div
            className="w-full rounded-t bg-brand-gradient transition-opacity hover:opacity-80"
            style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? '4px' : '0px' }}
          />
          <div className="pointer-events-none absolute bottom-full mb-1 hidden whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
            {formatDate(d.day)}: {formatTooltipValue(d.value)}
          </div>
        </div>
      ))}
    </div>
  )
}
