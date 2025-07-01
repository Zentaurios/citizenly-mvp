'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { loginWithCookie } from '@/lib/actions/cookie-auth'

function LoginForm() {
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
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account
          </p>
        </div>

        {/* Card */}
        <Card>
          <CardContent className="p-8">
            <form action={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-1"
                  placeholder="you@example.com"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-1"
                  placeholder="••••••••"
                  disabled={isLoading}
                />
              </div>

              {redirectTo && (
                <input type="hidden" name="redirect" value={redirectTo} />
              )}

              {error && (
                <div className="text-red-600 text-sm text-center">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            {/* Test Accounts */}
            <div className="mt-6 border-t pt-6">
              <p className="text-sm text-gray-600 text-center mb-3">
                Demo Accounts:
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Citizen:</span>
                  <span className="font-mono">citizen@test.com / password123</span>
                </div>
                <div className="flex justify-between">
                  <span>Politician:</span>
                  <span className="font-mono">politician@test.com / password123</span>
                </div>
                <div className="flex justify-between">
                  <span>Admin:</span>
                  <span className="font-mono">admin@test.com / password123</span>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-6 flex flex-col space-y-2 text-sm text-center">
              <span className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500">
                  Sign up
                </Link>
              </span>
              <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}