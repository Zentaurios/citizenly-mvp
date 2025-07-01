import { Pool, PoolConfig } from 'pg'

interface DatabaseConfig extends PoolConfig {
  connectionString?: string
}

class Database {
  private pool: Pool
  private static instance: Database

  private constructor() {
    const config: DatabaseConfig = {
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }

    // For development, allow self-signed certificates
    if (process.env.NODE_ENV === 'development') {
      config.ssl = false
    } else if (process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: false
      }
    }

    this.pool = new Pool(config)

    // Handle pool errors
    this.pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err)
      process.exit(-1)
    })

    // Log connection info in development
    if (process.env.NODE_ENV === 'development') {
      this.pool.on('connect', () => {
        console.log('Database client connected')
      })
    }
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  public async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now()
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Executed query', { text, duration, rows: result.rowCount })
      }
      
      return result
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  public async getClient() {
    return await this.pool.connect()
  }

  public async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  public async end(): Promise<void> {
    await this.pool.end()
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT 1 as health_check')
      return result.rows[0]?.health_check === 1
    } catch (error) {
      console.error('Database health check failed:', error)
      return false
    }
  }
}

// Export singleton instance
const db = Database.getInstance()
export default db

// Helper functions for common database operations
export async function executeQuery(query: string, params?: any[]) {
  return await db.query(query, params)
}

export async function executeTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  return await db.transaction(callback)
}

// Database connection validation
export async function validateDatabaseConnection(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required')
  }

  try {
    const isHealthy = await db.healthCheck()
    if (!isHealthy) {
      throw new Error('Database health check failed')
    }
    console.log('✅ Database connection validated')
  } catch (error) {
    console.error('❌ Database connection failed:', error)
    throw error
  }
}

// Connection pool stats (for monitoring)
export function getPoolStats() {
  const pool = (db as any).pool
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  }
}
