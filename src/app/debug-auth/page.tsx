'use client'

import { useState, useEffect } from 'react'

interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  verificationStatus: string
  emailVerified: boolean
  isActive: boolean
}

interface AuthState {
  user: AuthUser | null
  authError: string | null
  loading: boolean
  hasCookie: boolean
}

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    authError: null,
    loading: true,
    hasCookie: false
  })

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      
      setAuthState({
        user: data.user,
        authError: data.error,
        loading: false,
        hasCookie: data.hasCookie
      })
    } catch (error) {
      setAuthState({
        user: null,
        authError: 'Failed to check auth status',
        loading: false,
        hasCookie: false
      })
    }
  }

  const clearCookies = async () => {
    try {
      await fetch('/api/auth/clear-cookies', { method: 'POST' })
      window.location.reload()
    } catch (error) {
      console.error('Failed to clear cookies:', error)
    }
  }

  if (authState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }
  
  if (!authState.user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md text-center">
          <h1 className="mb-4 text-2xl font-bold text-gray-900">Debug: Not Authenticated</h1>
          <p className="mb-4 text-gray-600">No user session found</p>
          
          {authState.authError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
              <p className="text-red-700 text-sm font-medium">Authentication Error:</p>
              <p className="text-red-600 text-xs mt-1">{authState.authError}</p>
            </div>
          )}
          
          {authState.hasCookie && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-yellow-700 text-sm font-medium">Session Cookie Found</p>
              <p className="text-yellow-600 text-xs mt-1">
                Cookie exists but has invalid signature. Click "Clear Cookies" below.
              </p>
            </div>
          )}
          
          <div className="space-y-3">
            <button
              onClick={clearCookies}
              className="block w-full px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Clear All Cookies
            </button>
            <a 
              href="/login"
              className="block w-full px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md text-center">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Debug: Authenticated!</h1>
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold">User Details:</h2>
          <div className="space-y-2 text-left">
            <p><strong>ID:</strong> {authState.user.id}</p>
            <p><strong>Email:</strong> {authState.user.email}</p>
            <p><strong>Name:</strong> {authState.user.firstName} {authState.user.lastName}</p>
            <p><strong>Role:</strong> {authState.user.role}</p>
            <p><strong>Verification:</strong> {authState.user.verificationStatus}</p>
            <p><strong>Active:</strong> {authState.user.isActive ? 'Yes' : 'No'}</p>
          </div>
          <div className="mt-6 space-y-2">
            <a 
              href="/dashboard" 
              className="block w-full px-4 py-2 text-white bg-purple-600 rounded hover:bg-purple-700"
            >
              Go to Dashboard
            </a>
            <button 
              onClick={() => fetch('/api/auth/logout', { method: 'POST' }).then(() => window.location.href = '/login')}
              className="w-full px-4 py-2 text-white bg-gray-600 rounded hover:bg-gray-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}