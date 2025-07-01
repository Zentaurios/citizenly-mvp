import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const correctPassword = process.env.APP_PASSWORD
    
    if (!correctPassword) {
      return NextResponse.json(
        { error: 'Application password not configured' },
        { status: 500 }
      )
    }
    
    if (password === correctPassword) {
      // Set cookie to remember password authentication
      const response = NextResponse.json({ success: true })
      
      // Set cookie for 24 hours
      const cookieStore = await cookies()
      cookieStore.set('app-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60, // 24 hours
        path: '/'
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'Incorrect password' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('App access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}