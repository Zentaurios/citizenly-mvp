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

// Login action
export async function login(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    // Validate input
    const validatedData = LoginSchema.parse(rawData)

    // Check if user exists
    const result = await db.query(
      'SELECT id, email, role, verification_status, is_active FROM users WHERE email = $1',
      [validatedData.email]
    )

    if (result.rows.length === 0) {
      return { error: 'Invalid email or password' }
    }

    const user = result.rows[0]

    // Check if account is active
    if (!user.is_active) {
      return { error: 'Account is deactivated. Please contact support.' }
    }

    // Simple password verification for MVP
    if (!checkPassword(validatedData.email, validatedData.password)) {
      return { error: 'Invalid email or password' }
    }

    // Create session token with explicit secret from env
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('JWT_SECRET not found in environment')
      return { error: 'Server configuration error' }
    }

    const sessionToken = jwt.sign(
      { userId: user.id, type: 'session' },
      secret,
      { expiresIn: '7d' }
    )

    console.log('Login: Setting cookie with token for user:', user.id)
    console.log('Login: JWT_SECRET exists:', !!secret)

    // Clear any existing cookies first
    const cookieStore = await cookies()
    try {
      cookieStore.delete('citizenly-session')
    } catch (e) {
      // Cookie might not exist
    }

    // Set new cookie
    cookieStore.set('citizenly-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    )

    return { success: true, user: { id: user.id, email: user.email, role: user.role } }
  } catch (error) {
    console.error('Login error:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
    return { error: 'An error occurred during login' }
  }
}

// Register action (simplified)
export async function register(formData: FormData) {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      dateOfBirth: formData.get('dateOfBirth') as string,
      role: (formData.get('role') as string) || 'citizen',
    }

    // Validate input
    const validatedData = RegisterSchema.parse(rawData)

    // Check if user already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [validatedData.email]
    )

    if (existingUser.rows.length > 0) {
      return { error: 'An account with this email already exists' }
    }

    // Insert new user (no password hash needed for MVP)
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, date_of_birth, role, verification_status, email_verified, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 'verified', true, true)
       RETURNING id`,
      [
        validatedData.email,
        'simple-mvp-password', // Placeholder
        validatedData.firstName,
        validatedData.lastName,
        validatedData.dateOfBirth,
        validatedData.role,
      ]
    )

    const userId = result.rows[0].id

    // Create session token
    const sessionToken = createSessionToken(userId)

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set('citizenly-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    })

    return { success: true }
  } catch (error) {
    console.error('Registration error:', error)
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message }
    }
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
      role: user.role,
      verificationStatus: user.verificationStatus,
      emailVerified: true,
      isActive: user.isActive
    }
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}
