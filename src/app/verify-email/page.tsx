'use client'

import { Suspense, useState, useEffect } from 'react'
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

function VerifyEmailContent() {
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

  const resendVerificationEmail = async () => {
    setIsLoading(true)
    setMessage('')
    try {
      // In production, call resend verification endpoint
      await new Promise(resolve => setTimeout(resolve, 1500))
      setMessage('Verification email sent! Please check your inbox.')
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // If we have a token, show verification in progress
  if (token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            {isLoading ? (
              <>
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Verifying your email...</h2>
                <p className="text-gray-600">Please wait while we verify your email address.</p>
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Email Verified!</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link href="/login">
                  <Button className="w-full">
                    Continue to Login
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Verification Failed</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="space-y-3">
                  <Button onClick={resendVerificationEmail} className="w-full" variant="outline">
                    Resend Verification Email
                  </Button>
                  <Link href="/login" className="block">
                    <Button className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show email sent confirmation (after registration)
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            {registered ? 'Check Your Email' : 'Verify Your Email'}
          </CardTitle>
          <CardDescription>
            {registered 
              ? "We've sent a verification email to your inbox"
              : "Please verify your email address to continue"
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
              <li>Check your email inbox</li>
              <li>Click the verification link</li>
              <li>Return here to log in</li>
            </ol>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>Didn't receive the email?</p>
            <p className="mt-1">Check your spam folder or</p>
          </div>

          <Button 
            onClick={resendVerificationEmail} 
            className="w-full"
            variant="outline"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              'Resend Verification Email'
            )}
          </Button>

          {message && (
            <div className={`text-sm text-center ${message.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </div>
          )}

          <div className="text-center">
            <Link href="/login" className="text-sm text-blue-600 hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}