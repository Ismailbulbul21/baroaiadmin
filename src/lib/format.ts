const EAT_TIMEZONE = 'Africa/Nairobi' // UTC+3, same offset as East Africa Time

export function formatMoney(amount: number | null | undefined): string {
  const value = amount ?? 0
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: EAT_TIMEZONE,
  }).format(date)
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: EAT_TIMEZONE,
  }).format(date)
}

export function todayEatIso(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day}`
}

function eatDateDaysAgo(days: number): string {
  const now = new Date()
  now.setUTCDate(now.getUTCDate() - days)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: EAT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return `${map.year}-${map.month}-${map.day}`
}

export function startOfMonthEat(monthsAgo = 0): string {
  const todayIso = todayEatIso()
  const [y, m] = todayIso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 - monthsAgo, 1))
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${year}-${month}-01`
}

export function endOfMonthEat(monthsAgo = 0): string {
  const todayIso = todayEatIso()
  const [y, m] = todayIso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - monthsAgo, 0))
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function last7DaysRange(): { from: string; to: string } {
  return { from: eatDateDaysAgo(6), to: todayEatIso() }
}

export function monthLabel(isoDate: string): string {
  const [y, m] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, 1))
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(date)
}
