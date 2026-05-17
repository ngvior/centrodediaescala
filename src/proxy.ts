import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_CACHE_HEADERS = ['cache-control', 'expires', 'pragma']

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

function forwardSupabaseResponse(source: NextResponse, target: NextResponse) {
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie)
  })

  AUTH_CACHE_HEADERS.forEach((header) => {
    const value = source.headers.get(header)

    if (value) {
      target.headers.set(header, value)
    }
  })

  return target
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  let adminEmail: string


  try {
    adminEmail = getRequiredEnv('ADMIN_EMAIL')
  } catch (error) {
    return new NextResponse(
      error instanceof Error ? error.message : 'Missing admin configuration',
      { status: 500 }
    )
  }

  const supabase = createServerClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })

          supabaseResponse = NextResponse.next({ request })

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options)
          })

          Object.entries(headers).forEach(([key, value]) => {
            supabaseResponse.headers.set(key, value)
          })
        },
      },
    }
  )

  const { data, error } = await supabase.auth.getClaims()
  const isAdmin = !error && isAdminEmail(data?.claims.email, adminEmail)
  const pathname = request.nextUrl.pathname

  if (pathname === '/admin/login') {
    if (isAdmin) {
      const dashboardUrl = new URL('/admin/dashboard', request.url)
      return forwardSupabaseResponse(
        supabaseResponse,
        NextResponse.redirect(dashboardUrl)
      )
    }

    return supabaseResponse
  }

  if (!isAdmin) {
    const loginUrl = new URL('/admin/login', request.url)
    return forwardSupabaseResponse(
      supabaseResponse,
      NextResponse.redirect(loginUrl)
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: '/admin/:path*',
}
