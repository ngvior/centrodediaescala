'use client'

import { useActionState, type ReactNode } from 'react'

import {
  submitInterviewRequest,
  type InterviewSubmissionState,
} from '@/actions/interviews'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const initialState: InterviewSubmissionState = {
  status: 'idle',
  message: '',
}

export type InterviewRequestFormCopy = {
  title: string
  description: ReactNode
  contactNameLabel: string
  patientNameLabel: string
  phoneLabel: string
  emailLabel: string
  messageLabel: string
  messagePlaceholder: string
  submitLabel: string
  pendingLabel: string
  honeypotLabel: string
}

function getFieldError(
  state: InterviewSubmissionState,
  field: keyof NonNullable<InterviewSubmissionState['fieldErrors']>
) {
  return state.fieldErrors?.[field]
}

export function InterviewRequestForm({ copy }: { copy: InterviewRequestFormCopy }) {
  const [state, formAction, isPending] = useActionState(
    submitInterviewRequest,
    initialState
  )

  const contactNameError = getFieldError(state, 'contact_name')
  const phoneError = getFieldError(state, 'phone')
  const emailError = getFieldError(state, 'email')

  return (
    <form action={formAction} className="mt-12 space-y-6 rounded-lg border border-[#e5e5e5] bg-[#f9f9f9] p-6 text-left shadow-sm">
      <div className="text-center">
        <h3 className="mb-2 text-2xl font-bold text-primary">{copy.title}</h3>
        <div className="text-sm text-muted-foreground">
          {copy.description}
        </div>
      </div>

      <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <Label htmlFor="company_website">{copy.honeypotLabel}</Label>
        <Input
          id="company_website"
          name="company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact_name">{copy.contactNameLabel} *</Label>
          <Input
            id="contact_name"
            name="contact_name"
            aria-invalid={Boolean(contactNameError)}
            aria-describedby={contactNameError ? 'contact_name-error' : undefined}
            required
          />
          {contactNameError ? (
            <p id="contact_name-error" className="text-sm text-red-600">
              {contactNameError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="patient_name">{copy.patientNameLabel}</Label>
          <Input id="patient_name" name="patient_name" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">{copy.phoneLabel} *</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            aria-invalid={Boolean(phoneError)}
            aria-describedby={phoneError ? 'phone-error' : undefined}
            required
          />
          {phoneError ? (
            <p id="phone-error" className="text-sm text-red-600">
              {phoneError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{copy.emailLabel}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
          {emailError ? (
            <p id="email-error" className="text-sm text-red-600">
              {emailError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">{copy.messageLabel}</Label>
        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder={copy.messagePlaceholder}
        />
      </div>

      {state.message ? (
        <p
          className={state.status === 'success' ? 'text-sm font-semibold text-green-700' : 'text-sm font-semibold text-red-600'}
          role="status"
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full rounded-full uppercase" disabled={isPending}>
        {isPending ? copy.pendingLabel : copy.submitLabel}
      </Button>
    </form>
  )
}
