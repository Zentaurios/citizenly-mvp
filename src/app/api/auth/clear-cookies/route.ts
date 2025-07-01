import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Clear all possible auth-related cookies
    const cookiesToClear = [
      'citizenly-session',
      'next-auth.session-token', 
      'next-auth.csrf-token',
      '__Secure-next-auth.session-token',
      'authjs.session-token'
    ]
    
    cookiesToClear.forEach(cookieName => {
      try {
        cookieStore.delete(cookieName)
      } catch (err) {
        // Cookie might not exist, that's fine
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'All authentication cookies cleared' 
    })
  } catch (error) {
    console.error('Clear cookies error:', error)
    return NextResponse.json(
      { error: 'Failed to clear cookies' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}