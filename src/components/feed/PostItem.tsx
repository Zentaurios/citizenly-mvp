'use client'

import { Card } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Heart, MessageCircle, Share, Star, Building, User } from 'lucide-react'

interface PostItemProps {
  post: {
    id: string
    author: {
      name: string
      title?: string
      district?: string
      civicPoints?: number
      type: 'politician' | 'citizen'
    }
    content: string
    timestamp: string
    type: string
    pollId?: string
    billNumber?: string
    engagement: {
      likes: number
      comments: number
      shares: number
    }
  }
}

export default function PostItem({ post }: PostItemProps) {
  const isPolitician = post.author.type === 'politician'

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case 'political_update': return 'bg-blue-50 text-blue-700'
      case 'poll_announcement': return 'bg-purple-50 text-purple-700'
      case 'bill_announcement': return 'bg-green-50 text-green-700'
      case 'citizen_activity': return 'bg-orange-50 text-orange-700'
      case 'citizen_discussion': return 'bg-gray-50 text-gray-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const getPostTypeLabel = (type: string) => {
    switch (type) {
      case 'political_update': return 'Political Update'
      case 'poll_announcement': return 'New Poll'
      case 'bill_announcement': return 'Bill Announcement'
      case 'citizen_activity': return 'Civic Activity'
      case 'citizen_discussion': return 'Discussion'
      default: return 'Post'
    }
  }

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Avatar */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isPolitician ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {isPolitician ? (
                <Building className="w-5 h-5 text-blue-600" />
              ) : (
                <User className="w-5 h-5 text-purple-600" />
              )}
            </div>
            
            {/* Author Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                {isPolitician && (
                  <Badge variant="secondary" className="text-xs">
                    Verified Official
                  </Badge>
                )}
              </div>
              
              {isPolitician ? (
                <div className="text-sm text-gray-600">
                  {post.author.title} • {post.author.district}
                </div>
              ) : (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                  {post.author.civicPoints} Civic Points
                </div>
              )}
            </div>
          </div>
          
          {/* Post Type Badge */}
          <Badge className={`${getPostTypeColor(post.type)} text-xs`}>
            {getPostTypeLabel(post.type)}
          </Badge>
        </div>

        {/* Content */}
        <div className="text-gray-900">
          {post.content}
        </div>

        {/* Bill/Poll Info */}
        {post.billNumber && (
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{post.billNumber}</Badge>
          </div>
        )}

        {post.pollId && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-purple-700 font-medium">
                📊 Active Poll - Tap to participate
              </span>
              <Button size="sm" variant="outline">
                Vote Now
              </Button>
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <span>{post.engagement.likes} likes</span>
            <span>{post.engagement.comments} comments</span>
            <span>{post.engagement.shares} shares</span>
          </div>
          <span className="text-sm text-gray-500">{post.timestamp}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Heart className="w-4 h-4 mr-1" />
              Like
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <MessageCircle className="w-4 h-4 mr-1" />
              Comment
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-600">
              <Share className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}