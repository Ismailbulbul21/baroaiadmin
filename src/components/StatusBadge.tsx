import type { CodeStatus, PaymentOutcome, SubscriptionStatus } from '../types'

export function Badge({ color, label }: { color: 'green' | 'amber' | 'grey' | 'red'; label: string }) {
  const styles: Record<typeof color, string> = {
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    grey: 'bg-slate-200 text-slate-600',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[color]}`}>
      {label}
    </span>
  )
}

const OUTCOME_COLOR: Record<PaymentOutcome, 'green' | 'red'> = {
  approved: 'green',
  declined: 'red',
}

export function OutcomeBadge({ outcome }: { outcome: PaymentOutcome }) {
  return <Badge color={OUTCOME_COLOR[outcome]} label={outcome === 'approved' ? 'Approved' : 'Declined'} />
}

const SUB_STATUS_COLOR: Record<SubscriptionStatus, 'green' | 'grey' | 'amber'> = {
  active: 'green',
  expired: 'grey',
  canceled: 'amber',
}

const SUB_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  active: 'Active',
  expired: 'Expired',
  canceled: 'Canceled',
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge color={SUB_STATUS_COLOR[status]} label={SUB_STATUS_LABEL[status]} />
}

const STYLES: Record<CodeStatus, string> = {
  active: 'bg-emerald-100 text-emerald-700',
  paused: 'bg-amber-100 text-amber-700',
  stopped: 'bg-slate-200 text-slate-600',
}

const LABELS: Record<CodeStatus, string> = {
  active: 'Active',
  paused: 'Paused',
  stopped: 'Stopped',
}

export function StatusBadge({ status }: { status: CodeStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  )
}
