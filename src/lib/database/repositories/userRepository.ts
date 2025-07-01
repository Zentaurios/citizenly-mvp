import db from '../connection'
import { User, Address, Politician, AuthUser } from '../types'

class UserRepository {
  // Find user by email
  async findUserByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT 
        id, email, first_name, last_name, date_of_birth, phone,
        password_hash, role, verification_status, notification_preferences,
        interests, email_verified, email_verification_token,
        password_reset_token, password_reset_expires, last_login,
        is_active, created_at, updated_at
      FROM users 
      WHERE email = $1 AND is_active = true
    `
    
    const result = await db.query(query, [email])
    return result.rows[0] || null
  }

  // Find user by ID
  async findUserById(id: string): Promise<User | null> {
    const query = `
      SELECT 
        id, email, first_name, last_name, date_of_birth, phone,
        password_hash, role, verification_status, notification_preferences,
        interests, email_verified, email_verification_token,
        password_reset_token, password_reset_expires, last_login,
        is_active, created_at, updated_at
      FROM users 
      WHERE id = $1 AND is_active = true
    `
    
    const result = await db.query(query, [id])
    return result.rows[0] || null
  }

  // Create new user
  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const query = `
      INSERT INTO users (
        email, first_name, last_name, date_of_birth, phone,
        password_hash, role, verification_status, notification_preferences,
        interests, email_verified, email_verification_token,
        is_active
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING 
        id, email, first_name, last_name, date_of_birth, phone,
        password_hash, role, verification_status, notification_preferences,
        interests, email_verified, email_verification_token,
        password_reset_token, password_reset_expires, last_login,
        is_active, created_at, updated_at
    `
    
    const values = [
      userData.email,
      userData.first_name,
      userData.last_name,
      userData.date_of_birth,
      userData.phone,
      userData.password_hash,
      userData.role,
      userData.verification_status,
      JSON.stringify(userData.notification_preferences),
      JSON.stringify(userData.interests),
      userData.email_verified,
      userData.email_verification_token,
      userData.is_active
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }

  // Create address
  async createAddress(addressData: Omit<Address, 'id' | 'created_at' | 'updated_at'>): Promise<Address> {
    const query = `
      INSERT INTO addresses (
        user_id, street_address, city, state, zip_code,
        latitude, longitude, congressional_district,
        state_senate_district, state_house_district, county,
        timezone, is_primary
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
      )
      RETURNING 
        id, user_id, street_address, city, state, zip_code,
        latitude, longitude, congressional_district,
        state_senate_district, state_house_district, county,
        timezone, is_primary, created_at, updated_at
    `
    
    const values = [
      addressData.user_id,
      addressData.street_address,
      addressData.city,
      addressData.state,
      addressData.zip_code,
      addressData.latitude,
      addressData.longitude,
      addressData.congressional_district,
      addressData.state_senate_district,
      addressData.state_house_district,
      addressData.county,
      addressData.timezone,
      addressData.is_primary
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }

  // Create politician record
  async createPolitician(politicianData: Omit<Politician, 'id' | 'created_at' | 'updated_at'>): Promise<Politician> {
    const query = `
      INSERT INTO politicians (
        user_id, office_level, office_title, district, state,
        party, term_start, term_end, website, is_verified, premium_access
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING 
        id, user_id, office_level, office_title, district, state,
        party, term_start, term_end, website, is_verified, premium_access,
        verification_documents, created_at, updated_at
    `
    
    const values = [
      politicianData.user_id,
      politicianData.office_level,
      politicianData.office_title,
      politicianData.district,
      politicianData.state,
      politicianData.party,
      politicianData.term_start,
      politicianData.term_end,
      politicianData.website,
      politicianData.is_verified,
      politicianData.premium_access
    ]
    
    const result = await db.query(query, values)
    return result.rows[0]
  }

  // Update last login
  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    
    await db.query(query, [userId])
  }

  // Verify email
  async verifyEmail(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET email_verified = true, 
          email_verification_token = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    
    await db.query(query, [userId])
  }

  // Set password reset token
  async setPasswordResetToken(email: string, token: string, expiresAt: Date): Promise<void> {
    const query = `
      UPDATE users 
      SET password_reset_token = $2,
          password_reset_expires = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE email = $1
    `
    
    await db.query(query, [email, token, expiresAt])
  }

  // Reset password
  async resetPassword(token: string, newPasswordHash: string): Promise<boolean> {
    const query = `
      UPDATE users 
      SET password_hash = $2,
          password_reset_token = NULL,
          password_reset_expires = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE password_reset_token = $1 
        AND password_reset_expires > CURRENT_TIMESTAMP
    `
    
    const result = await db.query(query, [token, newPasswordHash])
    return result.rowCount > 0
  }

  // Get user's primary address
  async getUserPrimaryAddress(userId: string): Promise<Address | null> {
    const query = `
      SELECT 
        id, user_id, street_address, city, state, zip_code,
        latitude, longitude, congressional_district,
        state_senate_district, state_house_district, county,
        timezone, is_primary, created_at, updated_at
      FROM addresses
      WHERE user_id = $1 AND is_primary = true
    `
    
    const result = await db.query(query, [userId])
    return result.rows[0] || null
  }

  // Get politician info
  async getPoliticianInfo(userId: string): Promise<Politician | null> {
    const query = `
      SELECT 
        id, user_id, office_level, office_title, district, state,
        party, term_start, term_end, website, is_verified, premium_access,
        verification_documents, created_at, updated_at
      FROM politicians
      WHERE user_id = $1
    `
    
    const result = await db.query(query, [userId])
    return result.rows[0] || null
  }

  // Convert User to AuthUser
  toAuthUser(user: User): AuthUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      verificationStatus: user.verification_status,
      emailVerified: user.email_verified,
      isActive: user.is_active
    }
  }

  // Get user with all related data
  async getUserWithDetails(userId: string): Promise<{
    user: User
    address?: Address
    politician?: Politician
  } | null> {
    const user = await this.findUserById(userId)
    if (!user) return null

    const [address, politician] = await Promise.all([
      this.getUserPrimaryAddress(userId),
      user.role === 'politician' ? this.getPoliticianInfo(userId) : null
    ])

    return {
      user,
      address: address || undefined,
      politician: politician || undefined
    }
  }

  // Update user verification status
  async updateVerificationStatus(
    userId: string, 
    status: 'pending' | 'verified' | 'rejected'
  ): Promise<void> {
    const query = `
      UPDATE users 
      SET verification_status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    
    await db.query(query, [userId, status])
  }

  // Deactivate user account
  async deactivateUser(userId: string): Promise<void> {
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    
    await db.query(query, [userId])
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string, 
    preferences: { email: boolean; sms: boolean; push: boolean }
  ): Promise<void> {
    const query = `
      UPDATE users 
      SET notification_preferences = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `
    
    await db.query(query, [userId, JSON.stringify(preferences)])
  }

  // Get users by congressional district (for polling)
  async getUsersByCongressionalDistrict(district: string, state: string): Promise<AuthUser[]> {
    const query = `
      SELECT DISTINCT
        u.id, u.email, u.first_name, u.last_name, u.role,
        u.verification_status, u.email_verified, u.is_active
      FROM users u
      JOIN addresses a ON u.id = a.user_id
      WHERE a.congressional_district = $1 
        AND a.state = $2
        AND u.is_active = true
        AND u.verification_status = 'verified'
        AND a.is_primary = true
    `
    
    const result = await db.query(query, [district, state])
    return result.rows.map((row: any) => ({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      role: row.role,
      verificationStatus: row.verification_status,
      emailVerified: row.email_verified,
      isActive: row.is_active
    }))
  }
}

// Export singleton instance
const userRepository = new UserRepository()
export default userRepository
