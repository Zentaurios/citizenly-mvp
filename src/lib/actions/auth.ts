'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { db } from '@/lib/database'

// Validation schemas
const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  dateOfBirth: z.string().min(1, 'Date of birth is required'),
  role: z.enum(['citizen', 'politician']).default('citizen'),
})

// Helper function to create session token
function createSessionToken(userId: string) {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET not found in environment')
  }
  return jwt.sign(
    { userId, type: 'session' },
    secret,
    { expiresIn: '7d' }
  )
}

// Simple password check for MVP (no hashing)
function checkPassword(email: string, inputPassword: string): boolean {
  const testAccounts = {
    'admin@citizenly.com': 'admin123',
    'citizen@test.com': 'password123',
    'politician@test.com': 'password123'
  }
  
  return testAccounts[email as keyof typeof testAccounts] === inputPassword
}

// Login action - MVP version (database-free)
export async function login(formData: FormData) {
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

    // Create session token
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return { error: 'Server configuration error' }
    }

    const sessionToken = jwt.sign(
      { userId: user.id, type: 'session' },
      secret,
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.delete('citizenly-session')
    cookieStore.set('citizenly-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log('Login successful for:', email, 'role:', user.role)
    return { success: true, user: { id: user.id, email: email, role: user.role } }

  } catch (error) {
    console.error('Login error:', error)
    return { error: 'An error occurred during login' }
  }
}

// Register action - MVP version (database-free)
export async function register(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const role = (formData.get('role') as string) || 'citizen'

    if (!email || !password || !firstName || !lastName) {
      return { error: 'All fields are required' }
    }

    // For MVP: Simulate user creation (no actual database)
    const newUserId = `${role}-${Date.now()}`
    
    // Create session token
    const secret = process.env.JWT_SECRET
    if (!secret) {
      return { error: 'Server configuration error' }
    }

    const sessionToken = jwt.sign(
      { userId: newUserId, type: 'session' },
      secret,
      { expiresIn: '7d' }
    )

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set('citizenly-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    console.log('Registration successful for:', email, 'role:', role)
    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    return { error: 'An error occurred during registration' }
  }
}

// Logout action
export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('citizenly-session');
  redirect('/login');
}

// Get current user
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('citizenly-session')?.value;
    if (!token) {
      console.log('getCurrentUser: No token found')
      return null;
    }

    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('getCurrentUser: JWT_SECRET not found in environment')
      return null
    }

    console.log('getCurrentUser: Verifying token with secret')
    const payload = jwt.verify(token, secret) as { userId: string }
    console.log('getCurrentUser: Token verified for user:', payload.userId)

    // For MVP: Use hardcoded user data for test accounts
    const testUsers = {
      'admin-1': { id: 'admin-1', email: 'admin@citizenly.com', firstName: 'Admin', lastName: 'User', role: 'admin', verificationStatus: 'verified', isActive: true },
      'citizen-1': { id: 'citizen-1', email: 'citizen@test.com', firstName: 'Test', lastName: 'Citizen', role: 'citizen', verificationStatus: 'verified', isActive: true },
      'politician-1': { id: 'politician-1', email: 'politician@test.com', firstName: 'Test', lastName: 'Politician', role: 'politician', verificationStatus: 'verified', isActive: true }
    }
    
    const user = testUsers[payload.userId as keyof typeof testUsers]
    if (!user) {
      console.log('getCurrentUser: No user found for ID:', payload.userId)
      return null
    }

    console.log('getCurrentUser: Found user:', user.email, 'role:', user.role)
    
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role as 'admin' | 'citizen' | 'politician',
      verificationStatus: user.verificationStatus as 'pending' | 'verified' | 'rejected',
      emailVerified: true,
      isActive: user.isActive
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
