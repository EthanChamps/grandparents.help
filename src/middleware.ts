import { betterFetch } from '@better-fetch/fetch'
import { NextRequest, NextResponse } from 'next/server'

// Routes that require authentication
const protectedRoutes = ['/', '/dashboard', '/camera']

// Routes that should redirect to app if already authenticated
const authRoutes = ['/auth/senior', '/auth/family']

// Routes only for guardians (not seniors)
const guardianOnlyRoutes = ['/dashboard']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isGuardianOnlyRoute = guardianOnlyRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + '/')
  )

  // Skip if not a route we care about
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next()
  }

  // Fetch session from auth API
  const { data: session } = await betterFetch<{ user: { id: string; role?: string } } | null>(
    '/api/auth/get-session',
    {
      baseURL: request.nextUrl.origin,
      headers: {
        cookie: request.headers.get('cookie') || '',
      },
    }
  )

  const isAuthenticated = !!session?.user
  const isSenior = session?.user?.role === 'senior'

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/auth/senior', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Redirect seniors away from guardian-only routes (dashboard)
  if (isGuardianOnlyRoute && isAuthenticated && isSenior) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isAuthenticated) {
    // Family auth goes to dashboard, senior auth goes to home
    const isFamilyAuth = pathname.startsWith('/auth/family')
    const redirectUrl = isFamilyAuth && !isSenior ? '/dashboard' : '/'
    return NextResponse.redirect(new URL(redirectUrl, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (public folder)
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*|api).*)',
  ],
}
