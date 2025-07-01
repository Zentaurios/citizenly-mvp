// ============================================================================
// CITIZENLY PHASE 2: NOTIFICATION SYSTEM SERVER ACTIONS  
// File: src/lib/actions/notifications.ts
// ============================================================================

'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/database';
import { 
  Notification, 
  CreateNotificationInput, 
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
  NotificationChannel,
  NotificationType 
} from '@/lib/types/polls';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.enum(['new_poll', 'poll_results', 'poll_ending', 'poll_reminder', 'system_announcement']),
  title: z.string().min(1).max(255),
  content: z.string().max(2000).optional(),
  data: z.record(z.any()).optional(),
  channels: z.array(z.enum(['email', 'sms', 'push', 'in_app'])).optional(),
  priority: z.number().min(1).max(10).optional(),
  scheduled_for: z.date().optional(),
  expires_at: z.date().optional()
});

const updatePreferencesSchema = z.object({
  email_enabled: z.boolean().optional(),
  sms_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
  new_poll_notifications: z.boolean().optional(),
  poll_result_notifications: z.boolean().optional(),
  poll_reminder_notifications: z.boolean().optional(),
  poll_ending_notifications: z.boolean().optional(),
  system_notifications: z.boolean().optional(),
  digest_frequency: z.enum(['immediate', 'hourly', 'daily', 'weekly']).optional(),
  quiet_hours_start: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  quiet_hours_end: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  timezone: z.string().optional()
});

// ============================================================================
// NOTIFICATION CREATION
// ============================================================================

export async function createNotification(data: CreateNotificationInput): Promise<{ success: boolean; notification?: Notification; error?: string }> {
  try {
    // Validate input
    const validatedData = createNotificationSchema.parse(data);

    // Get user preferences
    const preferences = await getUserNotificationPreferences(validatedData.user_id);
    if (!preferences) {
      return { success: false, error: 'User preferences not found' };
    }

    // Check if user has this notification type enabled
    if (!isNotificationTypeEnabled(preferences, validatedData.type)) {
      return { success: true }; // Silent success - user has disabled this type
    }

    // Filter channels based on user preferences
    const enabledChannels = filterEnabledChannels(validatedData.channels || ['email', 'push'], preferences);
    if (enabledChannels.length === 0) {
      return { success: true }; // Silent success - no enabled channels
    }

    // Check quiet hours
    const scheduledFor = validatedData.scheduled_for || new Date();
    const adjustedSchedule = adjustForQuietHours(scheduledFor, preferences);

    // Insert notification
    const result = await db.query(`
      INSERT INTO notifications (
        user_id, type, title, content, data, channels, priority, scheduled_for, expires_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [
      validatedData.user_id,
      validatedData.type,
      validatedData.title,
      validatedData.content,
      JSON.stringify(validatedData.data || {}),
      enabledChannels,
      validatedData.priority || 5,
      adjustedSchedule,
      validatedData.expires_at
    ]);

    const notification = result.rows[0];

    // Process immediate notifications
    if (adjustedSchedule <= new Date()) {
      await processNotification(notification.id);
    }

    return { success: true, notification };

  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: 'Failed to create notification' };
  }
}

// ============================================================================
// BULK NOTIFICATION CREATION
// ============================================================================

export async function createBulkNotifications(
  userIds: string[], 
  notificationData: Omit<CreateNotificationInput, 'user_id'>
): Promise<{ success: boolean; created: number; error?: string }> {
  try {
    let createdCount = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const promises = batch.map(userId => 
        createNotification({ ...notificationData, user_id: userId })
      );

      const results = await Promise.allSettled(promises);
      createdCount += results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    }

    return { success: true, created: createdCount };

  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return { success: false, created: 0, error: 'Failed to create bulk notifications' };
  }
}

// ============================================================================
// NOTIFICATION PROCESSING
// ============================================================================

export async function processNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Get notification details
    const result = await db.query(`
      SELECT n.*, u.email, u.phone, u.first_name, u.last_name
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.id = $1 AND n.is_sent = false
    `, [notificationId]);

    if (!result.rows[0]) {
      return { success: false, error: 'Notification not found or already sent' };
    }

    const notification = result.rows[0];
    const user = {
      email: notification.email,
      phone_number: notification.phone,
      first_name: notification.first_name,
      last_name: notification.last_name
    };

    // Process each channel
    const deliveryResults: Record<string, string> = {};

    for (const channel of notification.channels) {
      try {
        switch (channel) {
          case 'email':
            if (user.email) {
              await sendEmailNotification(notification, user);
              deliveryResults.email_status = 'sent';
            } else {
              deliveryResults.email_status = 'failed';
            }
            break;

          case 'sms':
            if (user.phone_number) {
              await sendSMSNotification(notification, user);
              deliveryResults.sms_status = 'sent';
            } else {
              deliveryResults.sms_status = 'failed';
            }
            break;

          case 'push':
            await sendPushNotification(notification, user);
            deliveryResults.push_status = 'sent';
            break;

          case 'in_app':
            // In-app notifications are just stored in database, no external delivery needed
            break;
        }
      } catch (error) {
        console.error(`Error sending ${channel} notification:`, error);
        deliveryResults[`${channel}_status`] = 'failed';
      }
    }

    // Update notification status
    const updateFields = Object.entries(deliveryResults)
      .map(([key, value], index) => `${key} = $${index + 2}`)
      .join(', ');
    
    const updateValues = Object.values(deliveryResults);

    await db.query(`
      UPDATE notifications 
      SET is_sent = true, sent_at = NOW()${updateFields ? `, ${updateFields}` : ''}
      WHERE id = $1
    `, [notificationId, ...updateValues]);

    return { success: true };

  } catch (error) {
    console.error('Error processing notification:', error);
    return { success: false, error: 'Failed to process notification' };
  }
}

// ============================================================================
// NOTIFICATION RETRIEVAL
// ============================================================================

export async function getUserNotifications(
  page: number = 1, 
  limit: number = 20
): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error('Authentication required');
    }

    const offset = (page - 1) * limit;

    const [notificationsResult, countResult, unreadResult] = await Promise.all([
      db.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2 OFFSET $3
      `, [session.user.id, limit, offset]),
      
      db.query(`
        SELECT COUNT(*) as total 
        FROM notifications 
        WHERE user_id = $1
      `, [session.user.id]),
      
      db.query(`
        SELECT COUNT(*) as unread 
        FROM notifications 
        WHERE user_id = $1 AND is_read = false
      `, [session.user.id])
    ]);

    return {
      notifications: notificationsResult.rows,
      total: parseInt(countResult.rows[0].total),
      unreadCount: parseInt(unreadResult.rows[0].unread)
    };

  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

// ============================================================================
// NOTIFICATION ACTIONS
// ============================================================================

export async function markNotificationsAsRead(notificationIds: string[]): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    await db.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE id = ANY($1) AND user_id = $2
    `, [notificationIds, session.user.id]);

    revalidatePath('/notifications');
    return { success: true };

  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return { success: false, error: 'Failed to mark notifications as read' };
  }
}

export async function markAllNotificationsAsRead(): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    await db.query(`
      UPDATE notifications 
      SET is_read = true, read_at = NOW()
      WHERE user_id = $1 AND is_read = false
    `, [session.user.id]);

    revalidatePath('/notifications');
    return { success: true };

  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: 'Failed to mark all notifications as read' };
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

export async function getUserNotificationPreferences(userId?: string): Promise<NotificationPreferences | null> {
  try {
    const session = await auth();
    const targetUserId = userId || session?.user?.id;
    
    if (!targetUserId) {
      return null;
    }

    const result = await db.query(`
      SELECT * FROM notification_preferences WHERE user_id = $1
    `, [targetUserId]);

    return result.rows[0] || null;

  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return null;
  }
}

export async function updateNotificationPreferences(
  data: UpdateNotificationPreferencesInput
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: 'Authentication required' };
    }

    const validatedData = updatePreferencesSchema.parse(data);

    // Build update query
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = $${++paramCount}`);
        params.push(value);
      }
    });

    if (updates.length === 0) {
      return { success: false, error: 'No updates provided' };
    }

    updates.push(`updated_at = NOW()`);
    params.push(session.user.id);

    await db.query(`
      UPDATE notification_preferences 
      SET ${updates.join(', ')}
      WHERE user_id = $${++paramCount}
    `, params);

    revalidatePath('/settings/notifications');
    return { success: true };

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: 'Failed to update notification preferences' };
  }
}

// ============================================================================
// SCHEDULED NOTIFICATION PROCESSING
// ============================================================================

export async function processScheduledNotifications(): Promise<{ processed: number; errors: number }> {
  try {
    // Get notifications that are ready to be sent
    const result = await db.query(`
      SELECT id FROM notifications 
      WHERE is_sent = false 
      AND (scheduled_for IS NULL OR scheduled_for <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY priority DESC, created_at ASC
      LIMIT 100
    `);

    let processed = 0;
    let errors = 0;

    for (const notification of result.rows) {
      const result = await processNotification(notification.id);
      if (result.success) {
        processed++;
      } else {
        errors++;
      }
    }

    return { processed, errors };

  } catch (error) {
    console.error('Error processing scheduled notifications:', error);
    return { processed: 0, errors: 1 };
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function isNotificationTypeEnabled(preferences: NotificationPreferences, type: NotificationType): boolean {
  switch (type) {
    case 'new_poll':
      return preferences.new_poll_notifications;
    case 'poll_results':
      return preferences.poll_result_notifications;
    case 'poll_reminder':
      return preferences.poll_reminder_notifications;
    case 'poll_ending':
      return preferences.poll_ending_notifications;
    case 'system_announcement':
      return preferences.system_notifications;
    default:
      return true;
  }
}

function filterEnabledChannels(channels: NotificationChannel[], preferences: NotificationPreferences): NotificationChannel[] {
  return channels.filter(channel => {
    switch (channel) {
      case 'email':
        return preferences.email_enabled;
      case 'sms':
        return preferences.sms_enabled;
      case 'push':
        return preferences.push_enabled;
      case 'in_app':
        return preferences.in_app_enabled;
      default:
        return false;
    }
  });
}

function adjustForQuietHours(scheduledFor: Date, preferences: NotificationPreferences): Date {
  // If digest frequency is not immediate, don't adjust for quiet hours
  if (preferences.digest_frequency !== 'immediate') {
    return scheduledFor;
  }

  const now = new Date();
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: preferences.timezone }));
  
  const quietStart = parseTime(preferences.quiet_hours_start);
  const quietEnd = parseTime(preferences.quiet_hours_end);
  const currentTime = userTime.getHours() * 60 + userTime.getMinutes();

  // Check if we're in quiet hours
  const inQuietHours = quietStart > quietEnd 
    ? (currentTime >= quietStart || currentTime < quietEnd) // Overnight quiet hours
    : (currentTime >= quietStart && currentTime < quietEnd); // Same day quiet hours

  if (inQuietHours) {
    // Schedule for end of quiet hours
    const nextSend = new Date(userTime);
    nextSend.setHours(Math.floor(quietEnd / 60), quietEnd % 60, 0, 0);
    
    // If quiet hours end is today but in the past, schedule for tomorrow
    if (nextSend <= userTime) {
      nextSend.setDate(nextSend.getDate() + 1);
    }

    return nextSend;
  }

  return scheduledFor;
}

function parseTime(timeString: string): number {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
}

async function sendEmailNotification(notification: any, user: any): Promise<void> {
  // For MVP, just log the email notification
  console.log('Email notification would be sent:', {
    to: user.email,
    subject: notification.title,
    content: notification.content
  });
  
  // In production, integrate with email service like SendGrid, AWS SES, etc.
}

async function sendSMSNotification(notification: any, user: any): Promise<void> {
  // For MVP, just log the SMS notification
  console.log('SMS notification would be sent:', {
    to: user.phone_number,
    message: `${notification.title}: ${notification.content}`
  });
  
  // In production, integrate with SMS service like Twilio, AWS SNS, etc.
}

async function sendPushNotification(notification: any, user: any): Promise<void> {
  // For MVP, just log the push notification
  console.log('Push notification would be sent:', {
    title: notification.title,
    body: notification.content,
    data: notification.data
  });
  
  // In production, integrate with push service like Firebase Cloud Messaging, OneSignal, etc.
}
