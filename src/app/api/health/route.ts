import { NextRequest, NextResponse } from 'next/server'
import { validateDatabaseConnection, getPoolStats } from '@/lib/database/connection'

export async function GET(request: NextRequest) {
  try {
    // Check database connection
    await validateDatabaseConnection()
    
    // Get pool statistics
    const poolStats = getPoolStats()
    
    // Get current timestamp
    const timestamp = new Date().toISOString()
    
    // Basic health check response
    const healthData = {
      status: 'healthy',
      timestamp,
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: 'up',
        ...poolStats
      },
      services: {
        authentication: 'up',
        verification: process.env.MOCK_VERIFICATION === 'true' ? 'mock' : 'live',
        email: process.env.SMTP_PASSWORD ? 'configured' : 'not_configured',
        maps: process.env.GOOGLE_MAPS_API_KEY ? 'configured' : 'not_configured'
      }
    }
    
    return NextResponse.json(healthData, { status: 200 })
    
  } catch (error) {
    console.error('Health check failed:', error)
    
    const errorData = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'down'
      }
    }
    
    return NextResponse.json(errorData, { status: 503 })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
