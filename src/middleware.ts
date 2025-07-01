import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

// Define protected routes
const protectedRoutes = [
  '/dashboard',
  '/verification',
  '/politician',
  '/admin',
  '/profile',
  '/settings'
]

const authRoutes = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check app-level password protection first (except for the access page itself)
  if (pathname !== '/app-access' && !pathname.startsWith('/api/app-access')) {
    const appAccessCookie = request.cookies.get('app-access')?.value
    
    if (appAccessCookie !== 'granted') {
      return NextResponse.redirect(new URL('/app-access', request.url))
    }
  }
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Exception: Make politician-related pages public for MVP
  const isPublicProfile = pathname.startsWith('/profiles/')
  const isRepresentativesPage = pathname.startsWith('/representatives')
  
  // Override protection for public politician profiles and representatives page
  const shouldProtect = isProtectedRoute && !isPublicProfile && !isRepresentativesPage
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Get the session token from cookies
  const token = request.cookies.get('citizenly-session')?.value

  // If accessing a protected route
  if (shouldProtect) {
    if (!token) {
      // Redirect to login if no token
      return NextResponse.redirect(new URL('/login', request.url))
    }

    try {
      // Verify the JWT token
      const secret = process.env.JWT_SECRET || 'your-fallback-secret-key'
      const payload = jwt.verify(token, secret) as { userId: string; type: string }
      
      // Check if it's a session token
      if (payload.type !== 'session') {
        // Invalid token type, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url))
        response.cookies.delete('citizenly-session')
        return response
      }
      
      // Add user info to headers for server components
      const response = NextResponse.next()
      response.headers.set('x-user-id', payload.userId)
      
      return response
    } catch (error) {
      // Invalid token, redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('citizenly-session')
      return response
    }
  }

  // If accessing auth routes while logged in
  if (isAuthRoute && token) {
    try {
      // Verify token is still valid
      const secret = process.env.JWT_SECRET || 'your-fallback-secret-key'
      jwt.verify(token, secret)
      
      // Redirect to dashboard if already logged in
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      // Invalid token, clear it and continue to auth page
      const response = NextResponse.next()
      response.cookies.delete('citizenly-session')
      return response
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
