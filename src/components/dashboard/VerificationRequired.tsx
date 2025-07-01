import { AuthUser } from '@/lib/database/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Shield, 
  FileText, 
  MapPin, 
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react'

interface VerificationRequiredProps {
  user: AuthUser
}

export default function VerificationRequired({ user }: VerificationRequiredProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto h-16 w-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-8 w-8 text-purple-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Account Verification Required
        </h1>
        <p className="text-gray-600 mt-2">
          Complete the verification process to access all Citizenly features and ensure secure, 
          authenticated civic engagement.
        </p>
      </div>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2 text-orange-500" />
            Verification Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Email Verification */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <div className="font-medium">Email Verification</div>
                  <div className="text-sm text-gray-500">Your email has been verified</div>
                </div>
              </div>
              <div className="text-green-600 text-sm font-medium">Complete</div>
            </div>

            {/* Address Verification */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                <div>
                  <div className="font-medium">Address Verification</div>
                  <div className="text-sm text-gray-500">Nevada address confirmed</div>
                </div>
              </div>
              <div className="text-green-600 text-sm font-medium">Complete</div>
            </div>

            {/* ID Verification */}
            <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <div className="font-medium">ID Verification</div>
                  <div className="text-sm text-gray-500">Government-issued ID required</div>
                </div>
              </div>
              <div className="text-orange-600 text-sm font-medium">Pending</div>
            </div>

            {user.role === 'politician' && (
              <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-500 mr-3" />
                  <div>
                    <div className="font-medium">Official Verification</div>
                    <div className="text-sm text-gray-500">Political office documentation</div>
                  </div>
                </div>
                <div className="text-orange-600 text-sm font-medium">Pending</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              ID Verification
            </CardTitle>
            <CardDescription>
              Upload a government-issued photo ID for verification
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                <strong>Accepted Documents:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Driver's License</li>
                  <li>State-issued ID Card</li>
                  <li>U.S. Passport</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-sm text-blue-700">
                  <strong>Secure Process:</strong> Your documents are processed securely and 
                  not stored on our servers. We only extract necessary verification data.
                </div>
              </div>
              <Link href="/verification/id">
                <Button className="w-full">
                  Start ID Verification
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {user.role === 'politician' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Official Verification
              </CardTitle>
              <CardDescription>
                Verify your elected office status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  <strong>Required Documentation:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Official election certificate</li>
                    <li>Government website listing</li>
                    <li>Official contact information</li>
                  </ul>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-sm text-yellow-700">
                    <strong>Manual Review:</strong> Political office verification requires 
                    manual review by our team and may take 2-3 business days.
                  </div>
                </div>
                <Link href="/verification/politician">
                  <Button variant="outline" className="w-full">
                    Submit Documentation
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Why Verification Matters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div className="font-medium text-gray-900 mb-2">Authentic Engagement</div>
                <div className="text-sm text-gray-600">
                  Ensures only real constituents participate in polls and discussions
                </div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="font-medium text-gray-900 mb-2">Accurate Representation</div>
                <div className="text-sm text-gray-600">
                  Verification ensures polls reflect genuine constituent opinions
                </div>
              </div>
              <div className="text-center">
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <div className="font-medium text-gray-900 mb-2">Secure Platform</div>
                <div className="text-sm text-gray-600">
                  Protects against fraud and maintains election integrity
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Support */}
      <Card className="bg-gray-50">
        <CardContent className="p-6">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-amber-500 mr-3" />
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                Need Help with Verification?
              </div>
              <div className="text-sm text-gray-600">
                Our support team is here to help you through the verification process.
              </div>
            </div>
            <Button variant="outline">
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Limited Access Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="font-medium text-blue-900 mb-2">
              Limited Access Mode
            </div>
            <div className="text-sm text-blue-700">
              You can browse representatives and view public information, but poll participation 
              and creating content requires complete verification. This ensures the authenticity 
              and security of our civic engagement platform.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
