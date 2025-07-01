'use client'

import { useState } from 'react'
import { Card } from '../ui/card'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import PostItem from './PostItem'

// Sample data for MVP demo
const samplePosts = [
  {
    id: '1',
    author: {
      name: 'Rep. Dina Titus',
      title: 'U.S. Representative',
      district: 'Nevada District 1',
      type: 'politician' as const
    },
    content: "Just voted YES on the Infrastructure Investment Act. Nevada needs modern transportation systems to support our growing economy. What infrastructure priorities matter most to you?",
    timestamp: '2 hours ago',
    type: 'political_update',
    engagement: { likes: 234, comments: 67, shares: 45 }
  },
  {
    id: '2',
    author: {
      name: 'Sarah M.',
      civicPoints: 1250,
      type: 'citizen' as const
    },
    content: "Participated in 3 polls this week about local education funding. Love seeing how our input directly reaches our reps! 🗳️ #CivicEngagement",
    timestamp: '4 hours ago',
    type: 'citizen_activity',
    engagement: { likes: 89, comments: 12, shares: 8 }
  },
  {
    id: '3',
    author: {
      name: 'Rep. Susie Lee',
      title: 'U.S. Representative', 
      district: 'Nevada District 3',
      type: 'politician' as const
    },
    content: "New poll live now: Should Nevada expand renewable energy tax incentives? Your voice matters in shaping our energy future.",
    timestamp: '6 hours ago',
    type: 'poll_announcement',
    pollId: 'renewable-energy-poll',
    engagement: { likes: 156, comments: 43, shares: 22 }
  },
  {
    id: '4',
    author: {
      name: 'Mike T.',
      civicPoints: 890,
      type: 'citizen' as const
    },
    content: "Great town hall meeting yesterday with Senator Cortez Masto. Housing affordability is a real issue we need to address statewide.",
    timestamp: '1 day ago',
    type: 'citizen_discussion',
    engagement: { likes: 67, comments: 23, shares: 5 }
  },
  {
    id: '5',
    author: {
      name: 'Sen. Catherine Cortez Masto',
      title: 'U.S. Senator',
      district: 'Nevada',
      type: 'politician' as const
    },
    content: "Introducing the Nevada Housing Opportunity Act this week. This bipartisan bill will create 50,000 new affordable housing units across our state.",
    timestamp: '1 day ago',
    type: 'bill_announcement',
    billNumber: 'S.1234',
    engagement: { likes: 445, comments: 89, shares: 156 }
  }
]

export default function SocialFeed({ user }: { user: any }) {
  const [newPost, setNewPost] = useState('')
  const [posts, setPosts] = useState(samplePosts)

  const handleCreatePost = () => {
    if (!newPost.trim()) return
    
    // Demo: Add post to feed (won't actually save)
    const demoPost = {
      id: Date.now().toString(),
      author: {
        name: `${user.firstName} ${user.lastName}`,
        civicPoints: 1100,
        type: 'citizen' as const
      },
      content: newPost,
      timestamp: 'Just now',
      type: 'citizen_discussion',
      engagement: { likes: 0, comments: 0, shares: 0 }
    }
    
    setPosts([demoPost, ...posts])
    setNewPost('')
    
    // Show success message
    alert('Post created! (Demo mode - not actually saved)')
  }

  return (
    <div className="space-y-6">
      {/* Create Post */}
      <Card className="p-4">
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts on local politics, ask questions, or discuss community issues..."
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              Demo Mode: Posts won't be saved
            </span>
            <Button 
              onClick={handleCreatePost}
              disabled={!newPost.trim()}
            >
              Share Post
            </Button>
          </div>
        </div>
      </Card>

      {/* Feed Posts */}
      <div className="space-y-4">
        {posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}