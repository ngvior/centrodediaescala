import type { InterviewRequestStatus } from '@/actions/admin'

const INTERVIEW_STATUSES: InterviewRequestStatus[] = [
  'PENDING',
  'CONTACTED',
  'CONFIRMED',
  'REJECTED',
]

const BUENOS_AIRES_TIME_ZONE = 'America/Argentina/Buenos_Aires'
const DAY_IN_MS = 24 * 60 * 60 * 1000

// en-CA formats as YYYY-MM-DD, giving comparable calendar-day keys.
const calendarDayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUENOS_AIRES_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: BUENOS_AIRES_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('es-AR', {
  timeZone: BUENOS_AIRES_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

export function normalizeStatusFilter(
  status: string | string[] | undefined
): InterviewRequestStatus | undefined {
  const value = Array.isArray(status) ? status[0] : status

  return INTERVIEW_STATUSES.includes(value as InterviewRequestStatus)
    ? (value as InterviewRequestStatus)
    : undefined
}

/**
 * Card date label: "Recibida hoy · 09:14 a.m.", "Recibida ayer · 06:02 p.m."
 * or "Recibida el 05/07/2026 · 11:30 a.m.". Today/yesterday are calendar-day
 * comparisons in the Buenos Aires timezone, and the locale's "a. m." meridiem
 * is compacted to "a.m." to match the design. Computed server-side so SSR and
 * hydration render the same label.
 */
export function formatInterviewDateLabel(createdAt: string, now: Date = new Date()) {
  const created = new Date(createdAt)
  const time = timeFormatter
    .format(created)
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/([ap])\.\s*m\./i, '$1.m.')
  const createdDay = calendarDayFormatter.format(created)

  if (createdDay === calendarDayFormatter.format(now)) {
    return `Recibida hoy · ${time}`
  }

  // Argentina does not observe DST, so subtracting a day in UTC is safe.
  if (createdDay === calendarDayFormatter.format(new Date(now.getTime() - DAY_IN_MS))) {
    return `Recibida ayer · ${time}`
  }

  return `Recibida el ${dateFormatter.format(created)} · ${time}`
}
