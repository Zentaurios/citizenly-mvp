'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '@/lib/database'

// Server action for setting authentication cookie
export async function setAuthCookie(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not found in environment')
  }

  const sessionToken = jwt.sign(
    { userId, type: 'session' },
    secret,
    { expiresIn: '7d' }
  )

  const cookieStore = await cookies()
  
  // Clear any existing session cookies
  cookieStore.delete('citizenly-session')
  
  // Set new session cookie
  cookieStore.set('citizenly-session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  console.log('Server action: Set auth cookie for user:', userId)
}

// Server action for login with proper cookie handling
export async function loginWithCookie(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return { error: 'Email and password are required' }
    }

    // Simple password check for MVP
    const testAccounts = {
      'admin@citizenly.com': 'admin123',
      'citizen@test.com': 'password123',
      'politician@test.com': 'password123'
    }
    
    if (testAccounts[email as keyof typeof testAccounts] !== password) {
      return { error: 'Invalid email or password' }
    }

    // For MVP: Use hardcoded user data for test accounts
    const testUsers = {
      'admin@citizenly.com': { id: 'admin-1', role: 'admin', verification_status: 'verified', is_active: true },
      'citizen@test.com': { id: 'citizen-1', role: 'citizen', verification_status: 'verified', is_active: true },
      'politician@test.com': { id: 'politician-1', role: 'politician', verification_status: 'verified', is_active: true }
    }
    
    const user = testUsers[email as keyof typeof testUsers]
    if (!user) {
      return { error: 'Invalid email or password' }
    }

    // Set the authentication cookie
    await setAuthCookie(user.id)

    // Skip database update for MVP

    console.log('Login successful for:', email, 'role:', user.role)
    return { success: true, user: { id: user.id, email: email, role: user.role } }

  } catch (error) {
    console.error('Login with cookie error:', error)
    return { error: 'An error occurred during login' }
  }
}

// Server action for logout
export async function logoutWithCookie() {
  const cookieStore = await cookies()
  cookieStore.delete('citizenly-session')
  redirect('/login')
}