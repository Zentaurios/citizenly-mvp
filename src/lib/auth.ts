import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { db } from '@/lib/database'

export interface AuthSession {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: 'citizen' | 'politician' | 'admin';
    verification_status: 'pending' | 'verified' | 'rejected';
  }
}

export async function auth(): Promise<AuthSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('citizenly-session')?.value
    if (!token) return null

    const secret = process.env.JWT_SECRET || 'your-fallback-secret-key'
    const payload = jwt.verify(token, secret) as { userId: string }

    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, verification_status, is_active 
       FROM users WHERE id = $1 AND is_active = true`,
      [payload.userId]
    )

    if (result.rows.length === 0) return null

    const user = result.rows[0]
    return {
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        verification_status: user.verification_status
      }
    }
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export default auth
