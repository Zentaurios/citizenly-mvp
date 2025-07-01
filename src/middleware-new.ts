import { NextRequest, NextResponse } from 'next/server'
import * as jwt from 'jsonwebtoken'

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
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )
  
  // Check if the route is an auth route
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  )

  // For our custom JWT auth system
  const token = request.cookies.get('citizenly-session')?.value

  // If accessing a protected route without a token
  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If accessing auth routes with a valid token (user already logged in)
  if (isAuthRoute && token) {
    try {
      // Verify the token is valid
      jwt.verify(token, process.env.JWT_SECRET!)
      return NextResponse.redirect(new URL('/dashboard', request.url))
    } catch (error) {
      // Token is invalid, allow access to auth routes
      return NextResponse.next()
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}
