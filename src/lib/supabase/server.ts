import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function getRequiredEnv(name: string) {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet, headers) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )

            void headers
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if proxy is refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
