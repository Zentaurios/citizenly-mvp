import { NextRequest, NextResponse } from 'next/server'
import idVerification from '@/lib/verification/identity'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    // Verify webhook signature (in production, you'd verify this is from Jumio)
    const signature = request.headers.get('x-jumio-signature')
    
    // Extract scan reference and verification result
    const { scanReference, verificationStatus, extractedData } = data
    
    if (!scanReference) {
      return NextResponse.json(
        { error: 'Missing scan reference' },
        { status: 400 }
      )
    }
    
    // Process the callback
    await idVerification.handleJumioCallback(scanReference, {
      verificationStatus,
      ...extractedData
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Verification callback error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle GET for testing
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Verification callback endpoint is active',
    timestamp: new Date().toISOString()
  })
}
