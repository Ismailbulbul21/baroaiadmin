export type CodeStatus = 'active' | 'paused' | 'stopped'

export type PayoutMethod = 'evc' | 'zaad' | 'sahal' | 'edahab' | 'cash' | 'other'

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  evc: 'EVC Plus',
  zaad: 'Zaad',
  sahal: 'Sahal',
  edahab: 'eDahab',
  cash: 'Cash',
  other: 'Other',
}

export interface Overview {
  students: number
  revenue_usd: number
  earned_usd: number
  paid_usd: number
  owed_usd: number
  active_codes: number
  daily: { day: string; students: number; earned_usd: number }[]
  top_codes: { code: string; person_name: string; students: number; earned_usd: number }[]
}

export interface CodeRow {
  code: string
  person_name: string
  person_phone: string | null
  percent: number
  status: CodeStatus
  note: string | null
  created_at: string
  updated_at: string
  students: number
  revenue_usd: number
  earned_usd: number
  paid_usd: number
  owed_usd: number
}

export interface RateHistoryRow {
  changed_at: string
  old_percent: number
  new_percent: number
}

export interface ReferralRow {
  id: string
  created_at: string
  code: string
  student_name: string | null
  phone_masked: string | null
  plan_key: string
  plan_label: string
  amount_usd: number
  percent: number
  commission_usd: number
  payout_id: string | null
  paid_at: string | null
}

export interface PayoutRow {
  id: string
  code: string
  person_name: string
  amount_usd: number
  paid_at: string
  method: PayoutMethod
  reference: string | null
  note: string | null
  referral_count: number
  created_at: string
}

export interface PlanCommissionSetting {
  plan_key: string
  label: string
  amount_usd: number
  months: number | null
  days: number | null
  commission_enabled: boolean
}

export type PaymentOutcome = 'approved' | 'declined'

export interface RevenueOverview {
  revenue_usd: number
  successful_payments: number
  failed_payments: number
  new_subscriptions: number
  daily: { day: string; revenue_usd: number; successful_payments: number }[]
  by_plan: { plan_key: string; label: string; successful_payments: number; revenue_usd: number }[]
}

export interface PaymentRow {
  id: string
  created_at: string
  student_name: string | null
  phone_masked: string | null
  plan_key: string | null
  plan_label: string | null
  amount_usd: number | null
  wallet: string | null
  outcome: PaymentOutcome
  response_code: string | null
  error_code: string | null
  provider_message: string | null
  reference_id: string | null
  transaction_id: string | null
  referral_code: string | null
}

export type SubscriptionStatus = 'active' | 'expired' | 'canceled'

export interface SubscriptionRow {
  id: string
  created_at: string
  starts_at: string
  ends_at: string
  canceled_at: string | null
  status: SubscriptionStatus
  student_name: string | null
  phone_masked: string | null
  plan_key: string
  plan_label: string | null
  amount_usd: number | null
  currency: string
  source: string
  wallet: string | null
  reference_id: string | null
  transaction_id: string | null
}

export interface PlanCatalogRow {
  plan_key: string
  label: string
  amount_usd: number
  months: number | null
  days: number | null
  pass: boolean
  active: boolean
  allowances: unknown
  subscriber_count: number
  revenue_usd: number
}

export type DateRangeKey = 'this_month' | 'last_month' | 'last_7_days' | 'all_time' | 'custom'

export interface DateRange {
  key: DateRangeKey
  from: string | null
  to: string | null
}
