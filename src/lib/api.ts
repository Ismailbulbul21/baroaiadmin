import { supabase } from './supabase'
import type {
  CodeRow,
  CodeStatus,
  Overview,
  PayoutMethod,
  PayoutRow,
  PaymentOutcome,
  PaymentRow,
  PlanCatalogRow,
  PlanCommissionSetting,
  RateHistoryRow,
  ReferralRow,
  RevenueOverview,
  SubscriptionRow,
  SubscriptionStatus,
} from '../types'

export class ApiError extends Error {
  raw: unknown
  constructor(message: string, raw?: unknown) {
    super(message)
    this.raw = raw
  }
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  not_admin: 'No admin access.',
  code_invalid: 'Code must be 3-12 characters, A-Z and 0-9 only.',
  code_exists: 'This code already exists.',
  code_not_found: 'That code could not be found.',
  percent_invalid: 'Percent must be between 0 and 100.',
  code_stopped: "Stopped codes can't be changed.",
  referral_already_paid: 'One or more of those students are already marked paid.',
  referral_wrong_code: 'Those students do not belong to this code.',
  payout_not_found: 'That payout could not be found.',
  person_name_required: "Person's name is required.",
  status_invalid: 'That status is not valid.',
  method_invalid: 'That payout method is not valid.',
  plan_not_found: 'That plan could not be found.',
  outcome_invalid: 'That outcome filter is not valid.',
}

function friendlyError(error: unknown): ApiError {
  const message = (error as { message?: string })?.message ?? String(error)

  if (message.includes('does not exist')) {
    return new ApiError(
      'This feature is not deployed on the database yet (missing function). Tell the admin to deploy the database function.',
      error,
    )
  }

  const known = FRIENDLY_MESSAGES[message]
  if (known) return new ApiError(known, error)

  console.error('Supabase RPC error:', error)
  return new ApiError('Something went wrong.', error)
}

async function call<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) throw friendlyError(error)
  return data as T
}

export async function isAdmin(): Promise<boolean> {
  return call<boolean>('admin_is_admin')
}

export async function getOverview(from: string | null, to: string | null): Promise<Overview> {
  return call<Overview>('admin_referral_overview', { p_from: from, p_to: to })
}

export async function getCodes(): Promise<CodeRow[]> {
  return call<CodeRow[]>('admin_referral_codes')
}

export async function createCode(input: {
  code: string
  personName: string
  personPhone: string | null
  percent: number
  note: string | null
}): Promise<CodeRow> {
  return call<CodeRow>('admin_referral_code_create', {
    p_code: input.code,
    p_person_name: input.personName,
    p_person_phone: input.personPhone,
    p_percent: input.percent,
    p_note: input.note,
  })
}

export async function updateCode(input: {
  code: string
  personName: string
  personPhone: string | null
  percent: number
  note: string | null
}): Promise<CodeRow> {
  return call<CodeRow>('admin_referral_code_update', {
    p_code: input.code,
    p_person_name: input.personName,
    p_person_phone: input.personPhone,
    p_percent: input.percent,
    p_note: input.note,
  })
}

export async function setCodeStatus(code: string, status: CodeStatus): Promise<CodeRow> {
  return call<CodeRow>('admin_referral_code_set_status', { p_code: code, p_status: status })
}

export async function getCodeRateHistory(code: string): Promise<RateHistoryRow[]> {
  return call<RateHistoryRow[]>('admin_referral_code_rate_history', { p_code: code })
}

export async function getReferrals(
  code: string | null,
  from: string | null,
  to: string | null,
): Promise<ReferralRow[]> {
  return call<ReferralRow[]>('admin_referrals', { p_code: code, p_from: from, p_to: to })
}

export async function createPayout(input: {
  code: string
  referralIds: string[]
  paidAt: string
  method: PayoutMethod
  reference: string | null
  note: string | null
}): Promise<PayoutRow> {
  return call<PayoutRow>('admin_referral_payout_create', {
    p_code: input.code,
    p_referral_ids: input.referralIds,
    p_paid_at: input.paidAt,
    p_method: input.method,
    p_reference: input.reference,
    p_note: input.note,
  })
}

export async function deletePayout(payoutId: string): Promise<void> {
  await call<void>('admin_referral_payout_delete', { p_payout_id: payoutId })
}

export async function getPayouts(code: string | null): Promise<PayoutRow[]> {
  return call<PayoutRow[]>('admin_referral_payouts', { p_code: code })
}

export async function getPlanCommissionSettings(): Promise<PlanCommissionSetting[]> {
  return call<PlanCommissionSetting[]>('admin_plan_commission_settings')
}

export async function setPlanCommission(planKey: string, enabled: boolean): Promise<void> {
  await call<void>('admin_plan_commission_set', { p_plan_key: planKey, p_enabled: enabled })
}

export async function getRevenueOverview(from: string | null, to: string | null): Promise<RevenueOverview> {
  return call<RevenueOverview>('admin_revenue_overview', { p_from: from, p_to: to })
}

export async function getPayments(
  from: string | null,
  to: string | null,
  outcome: PaymentOutcome | null,
): Promise<PaymentRow[]> {
  return call<PaymentRow[]>('admin_payments', { p_from: from, p_to: to, p_outcome: outcome })
}

export async function getSubscriptions(
  from: string | null,
  to: string | null,
  status: SubscriptionStatus | null,
): Promise<SubscriptionRow[]> {
  return call<SubscriptionRow[]>('admin_subscriptions', { p_from: from, p_to: to, p_status: status })
}

export async function getPlanCatalog(): Promise<PlanCatalogRow[]> {
  return call<PlanCatalogRow[]>('admin_plan_catalog')
}
