'use server'

import { createHmac } from 'node:crypto'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'

import { createAdminClient } from '@/lib/supabase/admin'

export type InterviewFieldErrors = Partial<
  Record<'contact_name' | 'patient_name' | 'phone' | 'email' | 'message', string>
>

export type InterviewSubmissionState = {
  status: 'idle' | 'success' | 'error'
  message: string
  fieldErrors?: InterviewFieldErrors
}

type InterviewPayload = {
  contact_name: string
  patient_name: string | null
  phone: string
  email: string | null
  message: string | null
}

type RateLimitRow = {
  allowed: boolean
  request_count: number
}

type SupabaseError = {
  message: string
}

const HONEYPOT_FIELD = 'company_website'
const DEFAULT_RATE_LIMIT_MAX = 3
const DEFAULT_RATE_LIMIT_WINDOW_MINUTES = 60

const SUCCESS_MESSAGE =
  'Gracias. Recibimos tu solicitud y nos vamos a comunicar a la brevedad.'

const LIMIT_MESSAGE =
  'Recibimos muchas solicitudes desde esta conexión. Probá de nuevo más tarde o comunicate por teléfono.'

const SAFE_ERROR_MESSAGE =
  'No pudimos enviar la solicitud en este momento. Probá nuevamente más tarde.'

function getString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

function getOptionalString(formData: FormData, key: string) {
  const value = getString(formData, key)
  return value.length > 0 ? value : null
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const value = process.env[name]

  if (!value) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isInteger(parsed) || parsed < 1) {
    console.warn(
      `Invalid ${name}; falling back to ${fallback}.`
    )
    return fallback
  }

  return parsed
}

function validateInterviewPayload(formData: FormData) {
  const fieldErrors: InterviewFieldErrors = {}
  const contactName = getString(formData, 'contact_name')
  const patientName = getOptionalString(formData, 'patient_name')
  const phone = getString(formData, 'phone')
  const email = getOptionalString(formData, 'email')
  const message = getOptionalString(formData, 'message')

  if (!contactName) {
    fieldErrors.contact_name = 'Ingresá el nombre de contacto.'
  }

  if (!phone) {
    fieldErrors.phone = 'Ingresá un teléfono de contacto.'
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = 'Ingresá un email válido o dejá el campo vacío.'
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      fieldErrors,
      payload: null,
    }
  }

  return {
    fieldErrors: undefined,
    payload: {
      contact_name: contactName,
      patient_name: patientName,
      phone,
      email,
      message,
    } satisfies InterviewPayload,
  }
}

function getWindowStart(windowMinutes: number) {
  const windowMs = windowMinutes * 60 * 1000
  return new Date(Math.floor(Date.now() / windowMs) * windowMs).toISOString()
}

function getClientIp(headersList: Headers) {
  const forwardedFor = headersList.get('x-forwarded-for')
  const firstForwardedIp = forwardedFor?.split(',')[0]?.trim()

  return (
    firstForwardedIp ||
    headersList.get('x-real-ip')?.trim() ||
    headersList.get('cf-connecting-ip')?.trim() ||
    'unknown'
  )
}

function hashIp(ip: string, secret: string) {
  return createHmac('sha256', secret).update(ip).digest('hex')
}

function getRateLimitRow(data: RateLimitRow[] | RateLimitRow | null) {
  if (Array.isArray(data)) {
    return data[0] ?? null
  }

  return data
}

function errorState(message = SAFE_ERROR_MESSAGE): InterviewSubmissionState {
  return { status: 'error', message }
}

export async function submitInterviewRequest(
  _previousState: InterviewSubmissionState,
  formData: FormData
): Promise<InterviewSubmissionState> {
  if (getString(formData, HONEYPOT_FIELD).length > 0) {
    return { status: 'success', message: SUCCESS_MESSAGE }
  }

  const { fieldErrors, payload } = validateInterviewPayload(formData)

  if (!payload) {
    return {
      status: 'error',
      message: 'Revisá los campos marcados antes de enviar la solicitud.',
      fieldErrors,
    }
  }

  try {
    const rateLimitSecret = getRequiredEnv('RATE_LIMIT_SECRET')
    const maxRequests = getPositiveIntegerEnv(
      'INTERVIEW_RATE_LIMIT_MAX',
      DEFAULT_RATE_LIMIT_MAX
    )
    const windowMinutes = getPositiveIntegerEnv(
      'INTERVIEW_RATE_LIMIT_WINDOW_MINUTES',
      DEFAULT_RATE_LIMIT_WINDOW_MINUTES
    )
    const headersList = await headers()
    const ipHash = hashIp(getClientIp(headersList), rateLimitSecret)
    const supabase = createAdminClient()

    const { data: rateLimitData, error: rateLimitError } = (await supabase.rpc(
      'increment_interview_rate_limit',
      {
        p_ip_hash: ipHash,
        p_window_start: getWindowStart(windowMinutes),
        p_max_requests: maxRequests,
      }
    )) as {
      data: RateLimitRow[] | RateLimitRow | null
      error: SupabaseError | null
    }

    const rateLimit = getRateLimitRow(rateLimitData)

    if (rateLimitError || !rateLimit) {
      return errorState()
    }

    if (!rateLimit.allowed) {
      return errorState(LIMIT_MESSAGE)
    }

    const { error: insertError } = (await supabase
      .from('interview_requests')
      .insert(payload)) as { error: SupabaseError | null }

    if (insertError) {
      return errorState()
    }

    revalidatePath('/admin/dashboard')

    return { status: 'success', message: SUCCESS_MESSAGE }
  } catch (error) {
    console.error('submitInterviewRequest failed unexpectedly', {
      error: error instanceof Error ? error.message : String(error),
    })
    return errorState()
  }
}
