import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { AuthUser, Session } from '../database/types'
import db from '../database/connection'

// Security configuration
export const SECURITY_CONFIG = {
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12')
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-fallback-secret-key',
    expiresIn: '24h'
  },
  session: {
    cookieName: 'citizenly-session',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '900000'), // 15 minutes
    maxAttempts: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '5')
  }
}

// Password utilities
export class PasswordUtils {
  static async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, SECURITY_CONFIG.bcrypt.rounds)
  }

  static async verify(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash)
  }

  static validate(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long')
    }

    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Session management
export class SessionManager {
  static async createSession(
    userId: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<{ token: string; expiresAt: Date }> {
    const token = jwt.sign(
      { userId, type: 'session' },
      SECURITY_CONFIG.jwt.secret,
      { expiresIn: SECURITY_CONFIG.jwt.expiresIn }
    )

    const expiresAt = new Date(Date.now() + SECURITY_CONFIG.session.maxAge)

    // Store session in database
    const query = `
      INSERT INTO sessions (user_id, token, expires_at, ip_address, user_agent, is_active)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id
    `

    await db.query(query, [userId, token, expiresAt, ipAddress, userAgent])

    return { token, expiresAt }
  }

  static async validateSession(token: string): Promise<AuthUser | null> {
    try {
      // Verify JWT
      const decoded = jwt.verify(token, SECURITY_CONFIG.jwt.secret) as { userId: string; type: string }
      
      if (decoded.type !== 'session') {
        return null
      }

      // Check if session exists and is active
      const sessionQuery = `
        SELECT s.id, s.is_active, s.expires_at,
               u.id, u.email, u.first_name, u.last_name, u.role,
               u.verification_status, u.email_verified, u.is_active as user_active
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = $1 AND s.is_active = true AND s.expires_at > CURRENT_TIMESTAMP
      `

      const result = await db.query(sessionQuery, [token])
      const session = result.rows[0]

      if (!session || !session.user_active) {
        return null
      }

      return {
        id: session.id,
        email: session.email,
        firstName: session.first_name,
        lastName: session.last_name,
        role: session.role,
        verificationStatus: session.verification_status,
        emailVerified: session.email_verified,
        isActive: session.user_active
      }
    } catch (error) {
      console.error('Session validation error:', error)
      return null
    }
  }

  static async revokeSession(token: string): Promise<void> {
    const query = `
      UPDATE sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE token = $1
    `
    
    await db.query(query, [token])
  }

  static async revokeAllUserSessions(userId: string): Promise<void> {
    const query = `
      UPDATE sessions 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `
    
    await db.query(query, [userId])
  }

  static async cleanupExpiredSessions(): Promise<void> {
    const query = `
      DELETE FROM sessions 
      WHERE expires_at < CURRENT_TIMESTAMP OR is_active = false
    `
    
    await db.query(query)
  }
}

// Rate limiting
interface RateLimitResult {
  allowed: boolean
  resetTime: number
  remaining: number
}

export class RateLimiter {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map()

  static checkLimit(key: string, maxAttempts: number, windowMs: number): RateLimitResult {
    const now = Date.now()
    const record = this.attempts.get(key)

    if (!record || now > record.resetTime) {
      // First attempt or window expired
      this.attempts.set(key, { count: 1, resetTime: now + windowMs })
      return {
        allowed: true,
        resetTime: now + windowMs,
        remaining: maxAttempts - 1
      }
    }

    if (record.count >= maxAttempts) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: record.resetTime,
        remaining: 0
      }
    }

    // Increment attempts
    record.count++
    this.attempts.set(key, record)

    return {
      allowed: true,
      resetTime: record.resetTime,
      remaining: maxAttempts - record.count
    }
  }

  static checkLoginAttempts(email: string): RateLimitResult {
    return this.checkLimit(
      `login:${email}`,
      SECURITY_CONFIG.rateLimit.maxAttempts,
      SECURITY_CONFIG.rateLimit.windowMs
    )
  }

  static checkRegistrationAttempts(ipAddress: string): RateLimitResult {
    return this.checkLimit(
      `register:${ipAddress}`,
      SECURITY_CONFIG.rateLimit.maxAttempts,
      SECURITY_CONFIG.rateLimit.windowMs
    )
  }

  static reset(key: string): void {
    this.attempts.delete(key)
  }

  static cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.attempts.entries()) {
      if (now > record.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Validation utilities
export class ValidationUtils {
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/
    return phoneRegex.test(phone)
  }

  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '')
  }

  static isValidZipCode(zipCode: string): boolean {
    const zipRegex = /^\d{5}(-\d{4})?$/
    return zipRegex.test(zipCode)
  }

  static isValidState(state: string): boolean {
    const states = [
      'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
      'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
      'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
      'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
      'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ]
    return states.includes(state.toUpperCase())
  }
}

// Token utilities
export class TokenUtils {
  static generateEmailVerificationToken(): string {
    return jwt.sign(
      { type: 'email_verification', timestamp: Date.now() },
      SECURITY_CONFIG.jwt.secret,
      { expiresIn: '24h' }
    )
  }

  static generatePasswordResetToken(): string {
    return jwt.sign(
      { type: 'password_reset', timestamp: Date.now() },
      SECURITY_CONFIG.jwt.secret,
      { expiresIn: '1h' }
    )
  }

  static verifyEmailToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, SECURITY_CONFIG.jwt.secret) as { type: string }
      return decoded.type === 'email_verification'
    } catch {
      return false
    }
  }

  static verifyPasswordResetToken(token: string): boolean {
    try {
      const decoded = jwt.verify(token, SECURITY_CONFIG.jwt.secret) as { type: string }
      return decoded.type === 'password_reset'
    } catch {
      return false
    }
  }
}

// Audit logging
export class AuditLogger {
  static async logUserAction(
    userId: string,
    action: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO audit_logs (user_id, action, resource_type, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
    `
    
    await db.query(query, [
      userId,
      action,
      'user',
      JSON.stringify(details),
      ipAddress,
      userAgent
    ])
  }

  static async logSecurityEvent(
    action: string,
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const query = `
      INSERT INTO audit_logs (action, resource_type, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5)
    `
    
    await db.query(query, [
      action,
      'security',
      JSON.stringify(details),
      ipAddress,
      userAgent
    ])
  }

  static async getRecentUserActions(userId: string, limit: number = 10): Promise<any[]> {
    const query = `
      SELECT action, details, ip_address, created_at
      FROM audit_logs
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `
    
    const result = await db.query(query, [userId, limit])
    return result.rows
  }
}

// Next.js authentication verification
export async function verifyAuth(request?: NextRequest): Promise<{
  success: boolean;
  user?: AuthUser;
  error?: string;
}> {
  try {
    let token: string | undefined;

    if (request) {
      // Get token from request headers or cookies
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      } else {
        token = request.cookies.get(SECURITY_CONFIG.session.cookieName)?.value;
      }
    } else {
      // Get token from Next.js cookies (for server components)
      const cookieStore = cookies();
      token = cookieStore.get(SECURITY_CONFIG.session.cookieName)?.value;
    }

    if (!token) {
      return {
        success: false,
        error: 'No authentication token found'
      };
    }

    // Validate the session
    const user = await SessionManager.validateSession(token);
    
    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired session'
      };
    }

    return {
      success: true,
      user
    };

  } catch (error) {
    console.error('Auth verification error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

// Background task to cleanup expired sessions and rate limits
if (typeof window === 'undefined') {
  // Only run on server side
  setInterval(() => {
    RateLimiter.cleanup()
    SessionManager.cleanupExpiredSessions().catch(console.error)
  }, 5 * 60 * 1000) // Every 5 minutes
}
