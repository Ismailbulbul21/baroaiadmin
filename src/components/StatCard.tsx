export function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlight ? 'border-brand-to/30 bg-brand-gradient text-white' : 'border-slate-200 bg-white'
      }`}
    >
      <p className={`text-xs font-medium ${highlight ? 'text-white/80' : 'text-slate-500'}`}>{label}</p>
      <p className={`mt-1.5 text-2xl font-semibold ${highlight ? 'text-white' : 'text-navy'}`}>{value}</p>
    </div>
  )
}
