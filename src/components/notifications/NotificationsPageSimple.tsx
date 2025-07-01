'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Bell, Check, Star, Filter, Settings, Trash2, Eye, MessageSquare, BarChart3, FileText, Users, Calendar } from 'lucide-react'

export default function NotificationsPageSimple({ user }: { user: any }) {
  const [filter, setFilter] = useState('all')
  
  // Comprehensive sample notifications for investor demo
  const sampleNotifications = [
    {
      id: '1',
      type: 'new_poll',
      title: 'New Poll: Nevada Renewable Energy Initiative',
      content: 'Rep. Dina Titus is asking for your input on expanding solar energy incentives across Nevada. Your voice helps shape policy decisions.',
      politician: 'Rep. Dina Titus',
      timestamp: '2 hours ago',
      isRead: false,
      priority: 'high',
      actionUrl: '/polls/renewable-energy-2024'
    },
    {
      id: '2',
      type: 'bill_update',
      title: 'Bill Update: Infrastructure Investment Act',
      content: 'AB 342 has passed committee and is moving to floor vote. This bill affects transportation funding in your district.',
      politician: 'Sen. Catherine Cortez Masto',
      timestamp: '4 hours ago',
      isRead: false,
      priority: 'medium',
      billNumber: 'AB 342'
    },
    {
      id: '3',
      type: 'poll_results',
      title: 'Poll Results: Education Funding Priorities',
      content: 'Your community voted! 67% support increased teacher salaries, 23% prefer infrastructure improvements. See full breakdown.',
      politician: 'Rep. Susie Lee',
      timestamp: '1 day ago',
      isRead: false,
      priority: 'medium',
      results: '1,247 participants'
    },
    {
      id: '4',
      type: 'town_hall',
      title: 'Upcoming Town Hall: Housing Affordability',
      content: 'Join Sen. Jacky Rosen for a community discussion on housing costs and affordable housing initiatives.',
      politician: 'Sen. Jacky Rosen',
      timestamp: '1 day ago',
      isRead: true,
      priority: 'high',
      eventDate: 'January 15, 2025'
    },
    {
      id: '5',
      type: 'vote_alert',
      title: 'Voting Alert: Small Business Relief Act',
      content: 'Important vote happening today on SB 156. This affects tax relief for Nevada small businesses.',
      politician: 'Rep. Steven Horsford',
      timestamp: '2 days ago',
      isRead: true,
      priority: 'high',
      billNumber: 'SB 156'
    },
    {
      id: '6',
      type: 'community_update',
      title: 'Community Milestone: 10,000 Poll Participants',
      content: 'Nevada District 3 has reached 10,000 active poll participants! Your civic engagement is making a difference.',
      timestamp: '3 days ago',
      isRead: true,
      priority: 'low'
    },
    {
      id: '7',
      type: 'policy_brief',
      title: 'Policy Brief: Water Rights Legislation',
      content: 'New developments in Nevada water policy. Stay informed about upcoming changes that may affect your community.',
      politician: 'Rep. Mark Amodei',
      timestamp: '1 week ago',
      isRead: true,
      priority: 'medium'
    },
    {
      id: '8',
      type: 'system_announcement',
      title: 'Welcome to Citizenly!',
      content: 'Get started by following your representatives and participating in polls to earn civic points.',
      timestamp: '2 weeks ago',
      isRead: true,
      priority: 'low'
    }
  ]

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_poll': return { icon: '🗳️', color: 'text-purple-600' }
      case 'poll_results': return { icon: '📊', color: 'text-blue-600' }
      case 'bill_update': return { icon: '📜', color: 'text-green-600' }
      case 'vote_alert': return { icon: '⚡', color: 'text-red-600' }
      case 'town_hall': return { icon: '🏛️', color: 'text-orange-600' }
      case 'community_update': return { icon: '🎉', color: 'text-yellow-600' }
      case 'policy_brief': return { icon: '📋', color: 'text-indigo-600' }
      case 'system_announcement': return { icon: '📢', color: 'text-gray-600' }
      default: return { icon: '🔔', color: 'text-gray-600' }
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50'
      case 'medium': return 'border-l-yellow-500 bg-yellow-50'
      case 'low': return 'border-l-green-500 bg-green-50'
      default: return 'border-l-gray-500 bg-gray-50'
    }
  }

  const getFilteredNotifications = () => {
    if (filter === 'all') return sampleNotifications
    if (filter === 'unread') return sampleNotifications.filter(n => !n.isRead)
    return sampleNotifications.filter(n => n.type === filter)
  }

  const filteredNotifications = getFilteredNotifications()
  const unreadCount = sampleNotifications.filter(n => !n.isRead).length

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bell className="w-8 h-8 mr-3" />
            Notifications
          </h1>
          <p className="text-gray-600 mt-1">Stay informed about legislative activity and civic engagement opportunities</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{unreadCount}</div>
            <div className="text-sm text-gray-600">Unread</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">3</div>
            <div className="text-sm text-gray-600">Active Polls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">2</div>
            <div className="text-sm text-gray-600">Bill Updates</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">1</div>
            <div className="text-sm text-gray-600">Events</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter:</span>
            {[
              { key: 'all', label: 'All', count: sampleNotifications.length },
              { key: 'unread', label: 'Unread', count: unreadCount },
              { key: 'new_poll', label: 'Polls', count: sampleNotifications.filter(n => n.type === 'new_poll' || n.type === 'poll_results').length },
              { key: 'bill_update', label: 'Bills', count: sampleNotifications.filter(n => n.type === 'bill_update' || n.type === 'vote_alert').length },
              { key: 'town_hall', label: 'Events', count: sampleNotifications.filter(n => n.type === 'town_hall').length }
            ].map((filterOption) => (
              <Button
                key={filterOption.key}
                variant={filter === filterOption.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(filterOption.key)}
                className="text-xs"
              >
                {filterOption.label} ({filterOption.count})
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => {
          const iconData = getNotificationIcon(notification.type)
          return (
            <Card 
              key={notification.id} 
              className={`${notification.isRead ? 'opacity-75' : ''} border-l-4 ${getPriorityColor(notification.priority)} hover:shadow-md transition-shadow cursor-pointer`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className={`text-2xl ${iconData.color} flex-shrink-0`}>
                    {iconData.icon}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className={`font-semibold ${notification.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notification.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {notification.content}
                        </p>
                        
                        {/* Metadata */}
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>{notification.timestamp}</span>
                          {notification.politician && (
                            <span className="text-purple-600 font-medium">
                              From {notification.politician}
                            </span>
                          )}
                          {notification.billNumber && (
                            <Badge variant="outline" className="text-xs">
                              {notification.billNumber}
                            </Badge>
                          )}
                          {notification.results && (
                            <span className="text-blue-600">{notification.results}</span>
                          )}
                          {notification.eventDate && (
                            <span className="text-orange-600">{notification.eventDate}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-1 ml-4">
                        {!notification.isRead && (
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        )}
                        <Button variant="ghost" size="sm" className="p-1">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {(notification.actionUrl || notification.type === 'new_poll') && (
                      <div className="mt-3 flex space-x-2">
                        {notification.type === 'new_poll' && (
                          <Button size="sm" className="text-xs">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Participate Now
                          </Button>
                        )}
                        {notification.type === 'poll_results' && (
                          <Button variant="outline" size="sm" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            View Results
                          </Button>
                        )}
                        {notification.type === 'town_hall' && (
                          <Button variant="outline" size="sm" className="text-xs">
                            <Calendar className="w-3 h-3 mr-1" />
                            RSVP
                          </Button>
                        )}
                        {notification.type === 'bill_update' && (
                          <Button variant="outline" size="sm" className="text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Read Bill
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredNotifications.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
            <p className="text-gray-500">Try adjusting your filters or check back later for new updates.</p>
          </CardContent>
        </Card>
      )}

      {/* MVP Notice */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Star className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <div className="font-medium text-purple-900">MVP Demo Mode</div>
              <div className="text-sm text-purple-700">
                These are sample notifications showcasing the types of civic engagement alerts you'll receive. The full version includes real-time push notifications, email digests, and SMS alerts.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}