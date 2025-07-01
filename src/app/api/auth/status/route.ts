import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/actions/auth'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get('citizenly-session')
    
    console.log('Auth status check:')
    console.log('- Has cookie:', !!sessionCookie)
    console.log('- Cookie value (first 20 chars):', sessionCookie ? sessionCookie.value.substring(0, 20) + '...' : 'none')
    console.log('- JWT_SECRET exists:', !!process.env.JWT_SECRET)
    
    let user = null
    let error = null
    let jwtPayload = null
    
    if (sessionCookie) {
      try {
        const jwt = require('jsonwebtoken')
        const secret = process.env.JWT_SECRET
        if (!secret) {
          console.log('- JWT_SECRET not found in environment')
          error = 'JWT_SECRET not configured'
        } else {
          jwtPayload = jwt.verify(sessionCookie.value, secret)
          console.log('- JWT payload:', jwtPayload)
        }
      } catch (jwtError) {
        console.log('- JWT verification failed:', jwtError.message)
        error = `JWT Error: ${jwtError.message}`
      }
    }
    
    try {
      user = await getCurrentUser()
      console.log('- getCurrentUser success:', !!user)
    } catch (authError) {
      error = authError instanceof Error ? authError.message : 'Authentication failed'
      console.log('- getCurrentUser failed:', error)
    }
    
    return NextResponse.json({
      user,
      error,
      hasCookie: !!sessionCookie,
      cookieValue: sessionCookie ? sessionCookie.value.substring(0, 20) + '...' : null,
      jwtPayload,
      debug: {
        hasJwtSecret: !!process.env.JWT_SECRET,
        cookieExists: !!sessionCookie
      }
    })
  } catch (error) {
    console.error('Auth status error:', error)
    return NextResponse.json(
      { 
        user: null, 
        error: 'Failed to check auth status',
        hasCookie: false,
        cookieValue: null
      },
      { status: 500 }
    )
  }
}