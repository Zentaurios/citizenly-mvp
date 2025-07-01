// Simple audit logging function for now
import { db } from '@/lib/database'

interface AuditLogData {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await db.query(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      data.user_id,
      data.action,
      data.resource_type,
      data.resource_id,
      JSON.stringify(data.details),
      data.ip_address,
      data.user_agent
    ])
  } catch (error) {
    console.error('Audit log error:', error)
    // Don't throw - audit logging should not break the main functionality
  }
}
