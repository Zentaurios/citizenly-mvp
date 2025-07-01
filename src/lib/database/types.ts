// Database Types for Citizenly MVP
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  date_of_birth: string
  phone?: string
  password_hash: string
  role: 'citizen' | 'politician' | 'admin'
  verification_status: 'pending' | 'verified' | 'rejected'
  notification_preferences: {
    email: boolean
    sms: boolean
    push: boolean
  }
  interests: string[]
  email_verified: boolean
  email_verification_token?: string
  password_reset_token?: string
  password_reset_expires?: Date
  last_login?: Date
  is_active: boolean
  created_at: Date
  updated_at: Date
}

export interface Address {
  id: string
  user_id: string
  street_address: string
  city: string
  state: string
  zip_code: string
  latitude?: number
  longitude?: number
  congressional_district?: string
  state_senate_district?: string
  state_house_district?: string
  county?: string
  timezone?: string
  is_primary: boolean
  created_at: Date
  updated_at: Date
}

export interface Politician {
  id: string
  user_id: string
  office_level: 'federal' | 'state' | 'county' | 'city'
  office_title: string
  district?: string
  state: string
  party?: string
  term_start?: string
  term_end?: string
  website?: string
  is_verified: boolean
  premium_access: boolean
  verification_documents?: string[]
  created_at: Date
  updated_at: Date
}

export interface VerificationAttempt {
  id: string
  user_id: string
  verification_type: 'id' | 'address' | 'politician'
  status: 'pending' | 'approved' | 'rejected'
  provider: string
  external_id?: string
  documents?: string[]
  metadata?: Record<string, any>
  admin_notes?: string
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: string
  user_id: string
  token: string
  expires_at: Date
  ip_address?: string
  user_agent?: string
  is_active: boolean
  created_at: Date
}

export interface AuditLog {
  id: string
  user_id?: string
  action: string
  resource_type?: string
  resource_id?: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: Date
}

// Auth related types
export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'citizen' | 'politician' | 'admin'
  verificationStatus: 'pending' | 'verified' | 'rejected'
  emailVerified: boolean
  isActive: boolean
}

export interface RegistrationData {
  email: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phone?: string
  password: string
  confirmPassword: string
  role: 'citizen' | 'politician'
  address: {
    street: string
    city: string
    state: string
    zipCode: string
  }
  politicianInfo?: {
    officeLevel: 'federal' | 'state' | 'county' | 'city'
    officeTitle: string
    district?: string
    party?: string
    termStart?: string
    termEnd?: string
    website?: string
  }
  interests?: string[]
}

export interface LoginData {
  email: string
  password: string
}

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends Error {
  constructor(message: string = 'Authentication failed') {
    super(message)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends Error {
  constructor(message: string = 'Authorization failed') {
    super(message)
    this.name = 'AuthorizationError'
  }
}

export class DatabaseError extends Error {
  constructor(message: string = 'Database operation failed') {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class VerificationError extends Error {
  constructor(message: string = 'Verification failed') {
    super(message)
    this.name = 'VerificationError'
  }
}

// Geographic types
export interface GeographicData {
  latitude: number
  longitude: number
  congressionalDistrict?: string
  stateSenateDistrict?: string
  stateHouseDistrict?: string
  county?: string
  timezone?: string
}

export interface AddressValidationResult {
  isValid: boolean
  coordinates?: GeographicData
  formattedAddress?: string
  congressionalDistrict?: string
  stateSenateDistrict?: string
  stateHouseDistrict?: string
  county?: string
  timezone?: string
  errorMessage?: string
}

// ID Verification types
export interface IDVerificationData {
  firstName: string
  lastName: string
  dateOfBirth: string
  documentType: 'drivers_license' | 'state_id' | 'passport'
  documentNumber: string
  issuingState?: string
  expirationDate?: string
}

export interface IDVerificationResult {
  success: boolean
  verificationId?: string
  status?: 'pending' | 'approved' | 'rejected'
  errorMessage?: string
  extractedData?: {
    firstName: string
    lastName: string
    dateOfBirth: string
    address?: string
  }
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string[]>
}

// Polling types (for future implementation)
export interface Poll {
  id: string
  politician_id: string
  title: string
  description: string
  poll_type: 'yes_no' | 'approval' | 'multiple_choice'
  options?: string[]
  start_date: Date
  end_date?: Date
  is_active: boolean
  target_constituency: 'all' | 'district' | 'state' | 'custom'
  created_at: Date
  updated_at: Date
}

export interface PollResponse {
  id: string
  poll_id: string
  user_id: string
  response_data: Record<string, any>
  submitted_at: Date
}
