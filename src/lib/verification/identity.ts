import { IDVerificationData, IDVerificationResult } from '../database/types'
import db from '../database/connection'

interface JumioConfig {
  apiKey: string
  secret: string
  baseUrl: string
}

class IDVerification {
  private jumioConfig?: JumioConfig
  private mockMode: boolean

  constructor() {
    this.mockMode = process.env.MOCK_VERIFICATION === 'true' || !process.env.JUMIO_API_KEY

    if (!this.mockMode && process.env.JUMIO_API_KEY && process.env.JUMIO_SECRET) {
      this.jumioConfig = {
        apiKey: process.env.JUMIO_API_KEY,
        secret: process.env.JUMIO_SECRET,
        baseUrl: 'https://netverify.com/api/netverify/v2'
      }
    }
  }

  async startVerification(
    userId: string,
    documentData: IDVerificationData,
    ipAddress?: string
  ): Promise<IDVerificationResult> {
    try {
      // Save verification attempt to database
      const verificationId = await this.saveVerificationAttempt(userId, documentData, ipAddress)

      if (this.mockMode) {
        return await this.mockVerification(verificationId, documentData)
      }

      return await this.jumioVerification(verificationId, documentData)

    } catch (error) {
      console.error('ID verification error:', error)
      return {
        success: false,
        errorMessage: 'Verification service is temporarily unavailable. Please try again later.'
      }
    }
  }

  private async saveVerificationAttempt(
    userId: string,
    documentData: IDVerificationData,
    ipAddress?: string
  ): Promise<string> {
    const query = `
      INSERT INTO verification_attempts (
        user_id, verification_type, status, provider, metadata
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `

    const metadata = {
      documentType: documentData.documentType,
      issuingState: documentData.issuingState,
      ipAddress,
      timestamp: new Date().toISOString()
    }

    const result = await db.query(query, [
      userId,
      'id',
      'pending',
      this.mockMode ? 'mock' : 'jumio',
      JSON.stringify(metadata)
    ])

    return result.rows[0].id
  }

  private async mockVerification(
    verificationId: string,
    documentData: IDVerificationData
  ): Promise<IDVerificationResult> {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Mock success for development
    const isSuccess = Math.random() > 0.1 // 90% success rate for testing

    if (isSuccess) {
      await this.updateVerificationStatus(verificationId, 'approved', {
        extractedData: {
          firstName: documentData.firstName,
          lastName: documentData.lastName,
          dateOfBirth: documentData.dateOfBirth,
          address: '123 Mock Street, Mock City, NV 89123'
        },
        confidence: 0.95,
        mockResult: true
      })

      return {
        success: true,
        verificationId,
        status: 'approved',
        extractedData: {
          firstName: documentData.firstName,
          lastName: documentData.lastName,
          dateOfBirth: documentData.dateOfBirth,
          address: '123 Mock Street, Mock City, NV 89123'
        }
      }
    } else {
      await this.updateVerificationStatus(verificationId, 'rejected', {
        reason: 'Document quality insufficient',
        mockResult: true
      })

      return {
        success: false,
        verificationId,
        status: 'rejected',
        errorMessage: 'Document verification failed. Please ensure your document is clear and try again.'
      }
    }
  }

  private async jumioVerification(
    verificationId: string,
    documentData: IDVerificationData
  ): Promise<IDVerificationResult> {
    if (!this.jumioConfig) {
      throw new Error('Jumio configuration not available')
    }

    try {
      // Prepare Jumio request
      const jumioRequest = {
        customerInternalReference: verificationId,
        userReference: verificationId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/verification/callback`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verification/success`,
        errorUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verification/error`,
        locale: 'en',
        country: 'USA',
        documentTypes: this.getJumioDocumentType(documentData.documentType)
      }

      // Make request to Jumio
      const response = await fetch(`${this.jumioConfig.baseUrl}/initiateNetverify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.jumioConfig.apiKey}:${this.jumioConfig.secret}`).toString('base64')}`
        },
        body: JSON.stringify(jumioRequest)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(`Jumio API error: ${result.message || 'Unknown error'}`)
      }

      // Update verification with Jumio scan reference
      await this.updateVerificationStatus(verificationId, 'pending', {
        jumioScanReference: result.scanReference,
        redirectUrl: result.redirectUrl
      })

      return {
        success: true,
        verificationId,
        status: 'pending'
      }

    } catch (error) {
      console.error('Jumio verification error:', error)
      
      await this.updateVerificationStatus(verificationId, 'rejected', {
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        verificationId,
        status: 'rejected',
        errorMessage: 'Unable to start verification process. Please try again.'
      }
    }
  }

  private getJumioDocumentType(documentType: string): string {
    switch (documentType) {
      case 'drivers_license':
        return 'DRIVER_LICENSE'
      case 'state_id':
        return 'ID_CARD'
      case 'passport':
        return 'PASSPORT'
      default:
        return 'ID_CARD'
    }
  }

  private async updateVerificationStatus(
    verificationId: string,
    status: 'pending' | 'approved' | 'rejected',
    metadata: Record<string, any> = {}
  ): Promise<void> {
    const query = `
      UPDATE verification_attempts
      SET status = $2, metadata = metadata || $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `

    await db.query(query, [verificationId, status, JSON.stringify(metadata)])
  }

  // Handle webhook from Jumio
  async handleJumioCallback(
    scanReference: string,
    verificationResult: any
  ): Promise<void> {
    try {
      // Find verification by scan reference
      const query = `
        SELECT id, user_id FROM verification_attempts
        WHERE metadata->>'jumioScanReference' = $1
      `
      
      const result = await db.query(query, [scanReference])
      const verification = result.rows[0]

      if (!verification) {
        console.error('Verification not found for scan reference:', scanReference)
        return
      }

      const status = verificationResult.verificationStatus === 'APPROVED_VERIFIED' ? 'approved' : 'rejected'
      
      // Extract data from Jumio result
      const extractedData = status === 'approved' ? {
        firstName: verificationResult.firstName,
        lastName: verificationResult.lastName,
        dateOfBirth: verificationResult.dob,
        address: [
          verificationResult.address?.line1,
          verificationResult.address?.city,
          verificationResult.address?.subdivision,
          verificationResult.address?.postalCode
        ].filter(Boolean).join(', ')
      } : undefined

      // Update verification status
      await this.updateVerificationStatus(verification.id, status, {
        jumioResult: verificationResult,
        extractedData,
        processedAt: new Date().toISOString()
      })

      // Update user verification status if approved
      if (status === 'approved') {
        await this.updateUserVerificationStatus(verification.user_id, 'verified')
      }

    } catch (error) {
      console.error('Jumio callback handling error:', error)
    }
  }

  private async updateUserVerificationStatus(
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

  // Get verification status
  async getVerificationStatus(verificationId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected'
    extractedData?: any
    errorMessage?: string
  } | null> {
    const query = `
      SELECT status, metadata FROM verification_attempts
      WHERE id = $1
    `

    const result = await db.query(query, [verificationId])
    const verification = result.rows[0]

    if (!verification) {
      return null
    }

    const metadata = verification.metadata || {}

    return {
      status: verification.status,
      extractedData: metadata.extractedData,
      errorMessage: metadata.reason || metadata.error
    }
  }

  // Get user's verification attempts
  async getUserVerificationAttempts(userId: string): Promise<any[]> {
    const query = `
      SELECT id, verification_type, status, provider, created_at, updated_at
      FROM verification_attempts
      WHERE user_id = $1
      ORDER BY created_at DESC
    `

    const result = await db.query(query, [userId])
    return result.rows
  }

  // Admin function to manually approve/reject verification
  async manualVerificationReview(
    verificationId: string,
    status: 'approved' | 'rejected',
    adminNotes: string,
    adminUserId: string
  ): Promise<void> {
    await db.transaction(async (client) => {
      // Update verification
      await client.query(
        `UPDATE verification_attempts
         SET status = $2, admin_notes = $3, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [verificationId, status, adminNotes]
      )

      // Get user ID
      const userResult = await client.query(
        'SELECT user_id FROM verification_attempts WHERE id = $1',
        [verificationId]
      )

      if (userResult.rows[0] && status === 'approved') {
        // Update user verification status
        await client.query(
          'UPDATE users SET verification_status = $2 WHERE id = $1',
          [userResult.rows[0].user_id, 'verified']
        )
      }

      // Log admin action
      await client.query(
        `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          adminUserId,
          'manual_verification_review',
          'verification_attempt',
          verificationId,
          JSON.stringify({ status, adminNotes })
        ]
      )
    })
  }
}

// Export singleton instance
const idVerification = new IDVerification()
export default idVerification
