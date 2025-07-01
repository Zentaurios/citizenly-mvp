import { createClient } from '@supabase/supabase-js'

// Client-side Supabase client (uses anon key)
export const createClientComponentClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  })
}

// Server-side Supabase client (uses service role key for admin operations)
export const createServerComponentClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase server environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}

// Types for our database
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          first_name: string
          last_name: string
          date_of_birth: string
          phone?: string
          password_hash?: string
          role: 'citizen' | 'politician' | 'admin'
          verification_status: 'pending' | 'verified' | 'rejected'
          notification_preferences: any
          interests: string[]
          email_verified: boolean
          email_verification_token?: string
          password_reset_token?: string
          password_reset_expires?: string
          last_login?: string
          is_active: boolean
          supabase_user_id?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          first_name: string
          last_name: string
          date_of_birth: string
          phone?: string
          password_hash?: string
          role: 'citizen' | 'politician' | 'admin'
          verification_status?: 'pending' | 'verified' | 'rejected'
          notification_preferences?: any
          interests?: string[]
          email_verified?: boolean
          email_verification_token?: string
          password_reset_token?: string
          password_reset_expires?: string
          last_login?: string
          is_active?: boolean
          supabase_user_id?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          phone?: string
          password_hash?: string
          role?: 'citizen' | 'politician' | 'admin'
          verification_status?: 'pending' | 'verified' | 'rejected'
          notification_preferences?: any
          interests?: string[]
          email_verified?: boolean
          email_verification_token?: string
          password_reset_token?: string
          password_reset_expires?: string
          last_login?: string
          is_active?: boolean
          supabase_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      addresses: {
        Row: {
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
          created_at: string
          updated_at: string
        }
      }
      politicians: {
        Row: {
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
          created_at: string
          updated_at: string
        }
      }
      polls: {
        Row: {
          id: string
          politician_id: string
          title: string
          description?: string
          poll_type: 'yes_no' | 'approval' | 'multiple_choice'
          options?: any
          start_date: string
          end_date?: string
          is_active: boolean
          target_constituency: 'all' | 'district' | 'state' | 'custom'
          constituency_filter?: any
          created_at: string
          updated_at: string
        }
      }
    }
  }
}

// Export commonly used types
export type User = Database['public']['Tables']['users']['Row']
export type Address = Database['public']['Tables']['addresses']['Row']
export type Politician = Database['public']['Tables']['politicians']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
