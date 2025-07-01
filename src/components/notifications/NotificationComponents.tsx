'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Settings, 
  BarChart3, 
  Users, 
  Clock, 
  AlertCircle,
  Info,
  Volume2,
  VolumeX,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';

// Types for notifications
interface Notification {
  id: string;
  type: 'new_poll' | 'poll_results' | 'poll_ending' | 'poll_reminder' | 'system_announcement';
  title: string;
  content?: string;
  data?: {
    poll_id?: string;
    politician_name?: string;
    urgency?: 'low' | 'medium' | 'high';
    action_url?: string;
    poll_title?: string;
    poll_end_time?: string;
  };
  is_read: boolean;
  created_at: string;
  expires_at?: string;
}

interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  new_poll_notifications: boolean;
  poll_result_notifications: boolean;
  poll_reminder_notifications: boolean;
  poll_ending_notifications: boolean;
  system_notifications: boolean;
  digest_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  quiet_hours_start: string;
  quiet_hours_end: string;
  timezone: string;
}

// Notification Bell Component
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadNotifications();
    
    // Listen for real-time notifications
    const handleNewNotification = (event: CustomEvent) => {
      const newNotification = event.detail;
      setNotifications(prev => [newNotification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show browser notification if permitted
      if (Notification.permission === 'granted') {
        new Notification(newNotification.title, {
          body: newNotification.content,
          icon: '/icons/notification-icon.png',
          tag: newNotification.id
        });
      }
    };

    window.addEventListener('newNotification', handleNewNotification as EventListener);
    
    return () => {
      window.removeEventListener('newNotification', handleNewNotification as EventListener);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications?limit=20');
      if (!response.ok) {
        // For MVP: Use mock data when API fails
        console.log('Using mock notifications for MVP demo');
        setNotifications([{
          id: "1",
          type: "system_announcement",
          title: "Welcome to Citizenly MVP",
          content: "Stay informed about Nevada legislative activity that affects your district.",
          is_read: false,
          created_at: new Date().toISOString()
        }]);
        setUnreadCount(1);
        return;
      }
      
      const result = await response.json();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (error) {
      console.log('Using mock notifications for MVP demo');
      // For MVP: Provide fallback mock notifications
      setNotifications([{
        id: "1",
        type: "system_announcement",
        title: "Welcome to Citizenly MVP",
        content: "Stay informed about Nevada legislative activity that affects your district.",
        is_read: false,
        created_at: new Date().toISOString()
      }]);
      setUnreadCount(1);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_ids: notificationIds })
      });

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notificationIds.includes(notif.id) 
              ? { ...notif, is_read: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      });

      if (response.ok) {
        setNotifications(prev => prev.map(notif => ({ ...notif, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_poll': return <BarChart3 className="w-4 h-4 text-purple-600" />;
      case 'poll_results': return <Users className="w-4 h-4 text-blue-600" />;
      case 'poll_ending': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'poll_reminder': return <Bell className="w-4 h-4 text-yellow-600" />;
      case 'system_announcement': return <Info className="w-4 h-4 text-green-600" />;
      default: return <Bell className="w-4 h-4 text-gray-600" />;
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead([notification.id]);
    }

    if (notification.data?.action_url) {
      window.location.href = notification.data.action_url;
    } else if (notification.data?.poll_id) {
      window.location.href = `/polls/${notification.data.poll_id}`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                        }`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      {notification.content && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-gray-500">
                          {formatTimeAgo(notification.created_at)}
                        </p>
                        {notification.data?.urgency === 'high' && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200">
            <button
              onClick={() => {
                setIsOpen(false);
                window.location.href = '/notifications';
              }}
              className="w-full text-center text-sm text-purple-600 hover:text-purple-700"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Notification Preferences Component
export function NotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      if (!response.ok) throw new Error('Failed to load preferences');
      
      const result = await response.json();
      setPreferences(result.preferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      setSaving(true);
      setError('');
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update preferences');
      
      setPreferences(prev => prev ? { ...prev, ...updates } : null);
      setSuccess('Preferences updated successfully');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating preferences:', error);
      setError('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        updatePreferences({ push_enabled: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load notification preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
        <p className="text-gray-600 mt-1">Customize how and when you receive notifications</p>
      </div>

      <div className="p-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <Check className="w-5 h-5 text-green-500 mr-2" />
              <p className="text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Delivery Channels */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Delivery Channels</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via email</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.email_enabled}
                onChange={(e) => updatePreferences({ email_enabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive notifications via text message</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.sms_enabled}
                onChange={(e) => updatePreferences({ sms_enabled: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Smartphone className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">Receive browser push notifications</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {Notification.permission === 'default' && (
                  <button
                    onClick={requestNotificationPermission}
                    className="text-sm text-purple-600 hover:text-purple-700"
                  >
                    Enable
                  </button>
                )}
                <input
                  type="checkbox"
                  checked={preferences.push_enabled && Notification.permission === 'granted'}
                  onChange={(e) => updatePreferences({ push_enabled: e.target.checked })}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  disabled={saving || Notification.permission !== 'granted'}
                />
              </div>
            </label>
          </div>
        </div>

        {/* Notification Types */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Notification Types</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">New Polls</p>
                <p className="text-sm text-gray-600">When your representatives create new polls</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.new_poll_notifications}
                onChange={(e) => updatePreferences({ new_poll_notifications: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Poll Results</p>
                <p className="text-sm text-gray-600">When poll results are available</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.poll_result_notifications}
                onChange={(e) => updatePreferences({ poll_result_notifications: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Poll Reminders</p>
                <p className="text-sm text-gray-600">Reminders to vote on active polls</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.poll_reminder_notifications}
                onChange={(e) => updatePreferences({ poll_reminder_notifications: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Poll Ending Soon</p>
                <p className="text-sm text-gray-600">When polls are about to close</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.poll_ending_notifications}
                onChange={(e) => updatePreferences({ poll_ending_notifications: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">System Announcements</p>
                <p className="text-sm text-gray-600">Important system updates and announcements</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.system_notifications}
                onChange={(e) => updatePreferences({ system_notifications: e.target.checked })}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                disabled={saving}
              />
            </label>
          </div>
        </div>

        {/* Frequency Settings */}
        <div>
          <h3 className="text-md font-medium text-gray-900 mb-4">Frequency & Timing</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notification Frequency
              </label>
              <select
                value={preferences.digest_frequency}
                onChange={(e) => updatePreferences({ digest_frequency: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                disabled={saving}
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly Digest</option>
                <option value="daily">Daily Digest</option>
                <option value="weekly">Weekly Digest</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours Start
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreferences({ quiet_hours_start: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  disabled={saving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiet Hours End
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreferences({ quiet_hours_end: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                  disabled={saving}
                />
              </div>
            </div>
          </div>
        </div>

        {saving && (
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-purple-500 bg-purple-100">
              <div className="animate-spin -ml-1 mr-3 h-5 w-5 text-purple-500">
                <div className="rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
              </div>
              Saving preferences...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default { NotificationBell, NotificationPreferences };
