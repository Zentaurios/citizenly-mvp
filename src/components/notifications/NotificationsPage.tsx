'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Settings, 
  Filter,
  Search,
  BarChart3,
  Users,
  Clock,
  Info,
  AlertCircle,
  Check,
  CheckCircle,
  Trash2,
  Mail,
  MessageSquare,
  Smartphone
} from 'lucide-react';
import { AuthUser } from '@/lib/database/types';
import { NotificationPreferences } from '@/components/notifications/NotificationComponents';

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

interface NotificationsPageProps {
  user: AuthUser;
}

export default function NotificationsPage({ user }: NotificationsPageProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'notifications' | 'preferences'>('notifications');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterRead, setFilterRead] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [filterType, filterRead, page]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (filterType !== 'all') {
        params.append('type', filterType);
      }

      if (filterRead === 'unread') {
        params.append('unread_only', 'true');
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/notifications?${params}`);
      if (!response.ok) throw new Error('Failed to load notifications');
      
      const result = await response.json();
      
      if (page === 1) {
        setNotifications(result.notifications);
      } else {
        setNotifications(prev => [...prev, ...result.notifications]);
      }
      
      setHasMore(result.pagination.hasMore);
    } catch (error) {
      console.error('Error loading notifications:', error);
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
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_poll': return <BarChart3 className="w-5 h-5 text-purple-600" />;
      case 'poll_results': return <Users className="w-5 h-5 text-blue-600" />;
      case 'poll_ending': return <Clock className="w-5 h-5 text-orange-600" />;
      case 'poll_reminder': return <Bell className="w-5 h-5 text-yellow-600" />;
      case 'system_announcement': return <Info className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-gray-600" />;
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

  const filteredNotifications = notifications.filter(notification => {
    if (searchTerm && !notification.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !notification.content?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterRead === 'unread' && notification.is_read) {
      return false;
    }
    if (filterRead === 'read' && !notification.is_read) {
      return false;
    }
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600 mt-1">
              Stay updated with your civic engagement activities
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setCurrentView(currentView === 'notifications' ? 'preferences' : 'notifications')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <Settings className="w-5 h-5" />
              <span>{currentView === 'notifications' ? 'Preferences' : 'Notifications'}</span>
            </button>
          </div>
        </div>
      </div>

      {currentView === 'preferences' ? (
        <NotificationPreferences />
      ) : (
        <div className="space-y-6">
          {/* Stats and Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
                <div>
                  <div className="text-2xl font-bold text-gray-900">{notifications.length}</div>
                  <div className="text-sm text-gray-600">Total Notifications</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
                  <div className="text-sm text-gray-600">Unread</div>
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Types</option>
                <option value="new_poll">New Polls</option>
                <option value="poll_results">Poll Results</option>
                <option value="poll_ending">Poll Ending</option>
                <option value="poll_reminder">Reminders</option>
                <option value="system_announcement">System</option>
              </select>
              
              <select
                value={filterRead}
                onChange={(e) => setFilterRead(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </select>
            </div>
          </div>

          {/* Notifications List */}
          <div className="bg-white rounded-lg shadow-sm">
            {loading && page === 1 ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'all' || filterRead !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'You\'ll see notifications here when you have updates from your representatives'
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`p-6 cursor-pointer hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              notification.is_read ? 'text-gray-900' : 'text-gray-900 font-semibold'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.content && (
                              <p className="text-sm text-gray-600 mt-1">
                                {notification.content}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <p className="text-xs text-gray-500">
                                {formatTimeAgo(notification.created_at)}
                              </p>
                              <div className="flex items-center space-x-2">
                                {notification.data?.urgency === 'high' && (
                                  <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                    Urgent
                                  </span>
                                )}
                                {!notification.is_read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Load More */}
            {hasMore && !loading && (
              <div className="p-6 border-t border-gray-200 text-center">
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="text-purple-600 hover:text-purple-700 font-medium"
                >
                  Load More Notifications
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}