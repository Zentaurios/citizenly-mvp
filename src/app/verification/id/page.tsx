'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Shield, 
  FileText, 
  CheckCircle,
  AlertTriangle,
  Upload
} from 'lucide-react'

const DOCUMENT_TYPES = [
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'state_id', label: 'State-issued ID Card' },
  { value: 'passport', label: 'U.S. Passport' }
]

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

export default function IDVerificationPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)
  const router = useRouter()

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    documentType: 'drivers_license' as 'drivers_license' | 'state_id' | 'passport',
    documentNumber: '',
    issuingState: 'NV',
    expirationDate: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  {/*const handleSubmit = async () => {
    setIsLoading(true)
    setError('')

    try {
      const data = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value)
      })

      const result = await startIDVerification(data)
      
      if (result.success) {
        setStep(3) // Success step
      } else {
        setError(result.error || 'Verification failed to start')
      }
    } catch (error) {
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }*/}

  const canProceed = () => {
    return formData.firstName && formData.lastName && formData.dateOfBirth && 
           formData.documentNumber && formData.expirationDate
  }

  return (
    <div className="min-h-screen px-4 py-12 bg-gray-50 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-purple-100 rounded-full">
            <Shield className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            ID Verification
          </h1>
          <p className="mt-2 text-gray-600">
            Verify your identity with a government-issued photo ID
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div
                  className={`rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium ${
                    step >= stepNumber
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div
                    className={`h-1 w-20 mx-2 ${
                      step > stepNumber ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Step {step} of 3: {
              step === 1 ? 'Document Information' :
              step === 2 ? 'Document Upload' :
              'Verification Complete'
            }
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Enter Document Information'}
              {step === 2 && 'Upload Document'}
              {step === 3 && 'Verification Submitted'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Provide details from your government-issued photo ID'}
              {step === 2 && 'Take a clear photo of your document'}
              {step === 3 && 'Your verification is being processed'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="px-3 py-2 mb-6 text-sm text-red-600 border border-red-200 rounded-md bg-red-50">
                {error}
              </div>
            )}

            {/* Step 1: Document Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
                    <div className="text-sm text-blue-700">
                      <strong>Secure Process:</strong> Your documents are processed securely 
                      and are not stored on our servers. We only extract necessary verification data.
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="As shown on ID"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="As shown on ID"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentType">Document Type</Label>
                  <select
                    id="documentType"
                    value={formData.documentType}
                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                    className="flex w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="documentNumber">Document Number</Label>
                    <Input
                      id="documentNumber"
                      value={formData.documentNumber}
                      onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                      placeholder="ID number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="issuingState">Issuing State</Label>
                    <select
                      id="issuingState"
                      value={formData.issuingState}
                      onChange={(e) => handleInputChange('issuingState', e.target.value)}
                      className="flex w-full h-10 px-3 py-2 text-sm bg-white border border-gray-300 rounded-md"
                    >
                      {US_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expirationDate">Expiration Date</Label>
                  <Input
                    id="expirationDate"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => handleInputChange('expirationDate', e.target.value)}
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="w-full"
                >
                  Continue to Document Upload
                </Button>
              </div>
            )}

            {/* Step 2: Document Upload (Mock for MVP) */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm text-yellow-700">
                      <strong>MVP Notice:</strong> Document upload is simulated for the MVP. 
                      In production, this would integrate with Jumio or similar ID verification service.
                    </div>
                  </div>
                </div>

                <div className="p-8 text-center border-2 border-gray-300 border-dashed rounded-lg">
                  <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Upload Document Photo
                  </h3>
                  <p className="mb-4 text-sm text-gray-600">
                    Take a clear photo of the front of your {DOCUMENT_TYPES.find(t => t.value === formData.documentType)?.label}
                  </p>
                  <Button variant="outline" className="mb-4">
                    <FileText className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                  <div className="text-xs text-gray-500">
                    Supported formats: JPG, PNG, PDF (max 10MB)
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Photo Guidelines:</h4>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Ensure all four corners of the document are visible
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Photo should be clear and well-lit
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Avoid glare or shadows on the document
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      Make sure all text is readable
                    </li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Back
                  </Button>
                  {/*<Button
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <>
                        <div className="mr-2 loading-spinner" />
                        Processing...
                      </>
                    ) : (
                      'Submit for Verification'
                    )}
                  </Button>*/}
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {step === 3 && (
              <div className="space-y-6 text-center">
                <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                
                <div>
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Verification Submitted Successfully!
                  </h3>
                  <p className="text-gray-600">
                    Your ID verification has been submitted and is being processed. 
                    You'll receive an email notification once the verification is complete.
                  </p>
                </div>

                <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-sm text-blue-700">
                    <strong>Processing Time:</strong> ID verification typically takes 
                    2-24 hours. You can continue using Citizenly with limited access 
                    while verification is pending.
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full"
                  >
                    Return to Dashboard
                  </Button>
                  <Button
                    onClick={() => router.push('/verification')}
                    variant="outline"
                    className="w-full"
                  >
                    View Verification Status
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Help */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help with verification?{' '}
            <a href="/contact" className="text-purple-600 hover:text-purple-500">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
