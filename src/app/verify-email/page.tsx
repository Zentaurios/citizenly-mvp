'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Mail, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  ArrowRight
} from 'lucide-react'

export default function VerifyEmailPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [message, setMessage] = useState('')
  const searchParams = useSearchParams()
  
  const token = searchParams.get('token')
  const registered = searchParams.get('registered') === 'true'

  {/*useEffect(() => {
    if (token) {
      handleVerification()
    }
  }, [token])*/}

  {/*const handleVerification = async () => {
    if (!token) return

    setIsLoading(true)
    try {
      const result = await verifyEmail(token)
      if (result.success) {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } else {
        setStatus('error')
        setMessage(result.error || 'Email verification failed')
      }
    } catch (error) {
      setStatus('error')
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }*/}

  const handleResendEmail = async () => {
    // TODO: Implement resend email functionality
    console.log('Resend email clicked')
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/" className="text-2xl font-bold citizenly-text-gradient">
            Citizenly
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
              {status === 'success' ? (
                <CheckCircle className="w-8 h-8 text-green-600" />
              ) : status === 'error' ? (
                <AlertCircle className="w-8 h-8 text-red-600" />
              ) : (
                <Mail className="w-8 h-8 text-purple-600" />
              )}
            </div>
            <CardTitle>
              {status === 'success' ? 'Email Verified!' :
               status === 'error' ? 'Verification Failed' :
               'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {status === 'success' ? 'Your account is now ready to use' :
               status === 'error' ? 'There was a problem with your verification' :
               'Check your email for a verification link'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Success State */}
            {status === 'success' && (
              <div className="space-y-4 text-center">
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <p className="text-sm text-green-700">
                    {message}
                  </p>
                </div>
                <Link href="/login">
                  <Button className="w-full">
                    Continue to Sign In
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="space-y-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <p className="text-sm text-red-700">
                    {message}
                  </p>
                </div>
                <div className="space-y-2">
                  {/*<Button 
                    onClick={handleVerification} 
                    disabled={isLoading || !token}
                    variant="outline"
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 loading-spinner" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again
                      </>
                    )}
                  </Button>*/}
                  <Button 
                    onClick={handleResendEmail}
                    variant="ghost"
                    className="w-full"
                  >
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            )}

            {/* Pending State */}
            {status === 'pending' && !token && (
              <div className="space-y-4">
                {registered && (
                  <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <p className="text-sm text-blue-700">
                      <strong>Registration successful!</strong> We've sent a verification 
                      email to your address. Please check your inbox and click the 
                      verification link to activate your account.
                    </p>
                  </div>
                )}
                
                <div className="space-y-4 text-center">
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">
                      A verification email has been sent to your email address.
                    </p>
                    <p>
                      Click the link in the email to verify your account and complete 
                      your registration.
                    </p>
                  </div>
                  
                  <div className="p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                    <p className="text-xs text-yellow-700">
                      <strong>Can't find the email?</strong> Check your spam folder or 
                      request a new verification email.
                    </p>
                  </div>
                  
                  <Button 
                    onClick={handleResendEmail}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </Button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoading && token && (
              <div className="space-y-4 text-center">
                <div className="mx-auto loading-spinner" />
                <p className="text-sm text-gray-600">
                  Verifying your email address...
                </p>
              </div>
            )}

            {/* Help */}
            <div className="pt-4 text-center border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Need help?{' '}
                <Link href="/contact" className="text-purple-600 hover:text-purple-500">
                  Contact Support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
