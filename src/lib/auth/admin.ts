import 'server-only'

import { createClient } from '@/lib/supabase/server'

export type AdminUser = {
  id: string
  email: string
}

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function isAdminEmail(email: string | undefined, adminEmail: string) {
  return email?.trim().toLowerCase() === adminEmail.trim().toLowerCase()
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient()
  const adminEmail = getRequiredEnv('ADMIN_EMAIL')
  const { data, error } = await supabase.auth.getClaims()
  const email = data?.claims.email

  if (error || !data?.claims.sub || !email || !isAdminEmail(email, adminEmail)) {
    return null
  }

  return {
    id: data.claims.sub,
    email,
  }
}

export async function requireAdmin() {
  const admin = await getAdminUser()

  if (!admin) {
    throw new Error('No autorizado')
  }

  return admin
}
