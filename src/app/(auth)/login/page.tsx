'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginWithCookie } from '@/lib/actions/cookie-auth'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')

  async function handleSubmit(formData: FormData) {
    setIsLoading(true)
    setError('')

    try {
      const result = await loginWithCookie(formData)
      console.log('Login result:', result)
      
      if (result?.success) {
        // All users go to legislative feed
        console.log('Redirecting to: /legislative')
        window.location.href = '/legislative'
      } else {
        console.log('Login failed:', result)
        setError(result?.error || 'Login failed')
        setIsLoading(false)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold citizenly-text-gradient">
            Citizenly
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm">
                  <Link 
                    href="/forgot-password" 
                    className="text-purple-600 hover:text-purple-500"
                  >
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="loading-spinner mr-2" />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">New to Citizenly?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link href="/register">
                  <Button variant="outline" className="w-full">
                    Create an account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MVP Notice */}
        <div className="mt-8 text-center">
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-700">
              <strong>MVP Launch:</strong> Currently available for Nevada residents. 
              <Link href="/about" className="underline hover:no-underline">
                Learn more about our expansion plans
              </Link>
            </p>
          </div>
        </div>

        {/* Test Account Info (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 text-center space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-700">
                <strong>Test Accounts:</strong><br />
                Citizen: citizen@test.com / password123<br />
                Politician: politician@test.com / password123<br />
                Admin: admin@citizenly.com / admin123
              </p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-700">
                <strong>Debug Tools:</strong><br />
                <Link href="/debug-auth" className="underline hover:no-underline">
                  Check Authentication Status
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
