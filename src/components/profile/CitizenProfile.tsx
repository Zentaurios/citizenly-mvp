import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { MapPin, Star, Calendar, TrendingUp } from 'lucide-react'

export default function CitizenProfile({ user }: { user: any }) {
  // Sample citizen activity data
  const sampleActivity = [
    {
      type: 'poll_vote',
      title: 'Voted on Infrastructure Investment Poll',
      timestamp: '2 hours ago',
      politician: 'Rep. Dina Titus'
    },
    {
      type: 'social_post',
      title: 'Posted about education funding',
      timestamp: '1 day ago',
      engagement: '12 likes, 3 comments'
    },
    {
      type: 'poll_vote', 
      title: 'Voted on Renewable Energy Poll',
      timestamp: '3 days ago',
      politician: 'Rep. Susie Lee'
    },
    {
      type: 'social_post',
      title: 'Shared thoughts on transportation infrastructure',
      timestamp: '1 week ago',
      engagement: '8 likes, 5 comments'
    },
    {
      type: 'poll_vote',
      title: 'Voted on Housing Affordability Poll',
      timestamp: '1 week ago',
      politician: 'Sen. Catherine Cortez Masto'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'poll_vote': return '🗳️'
      case 'social_post': return '💬'
      default: return '📝'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-purple-600">
                {user.firstName?.[0]}{user.lastName?.[0]}
              </span>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <div className="flex items-center space-x-4 mt-2 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>Nevada District 3</span>
                </div>
                <div className="flex items-center">
                  <Star className="w-4 h-4 mr-1 text-yellow-500" />
                  <span className="font-medium">1,250 Civic Points</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <Badge variant="secondary">Verified Resident</Badge>
                <Badge variant="outline">Active Voter</Badge>
                <Badge variant="outline">Community Contributor</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">23</div>
            <div className="text-sm text-gray-600">Polls Participated</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">7</div>
            <div className="text-sm text-gray-600">Posts Created</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">4</div>
            <div className="text-sm text-gray-600">Reps Following</div>
          </CardContent>
        </Card>
      </div>

      {/* Civic Points Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Star className="w-5 h-5 mr-2 text-yellow-500" />
            Civic Points Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">🗳️</span>
                <span className="font-medium">Poll Participation</span>
              </div>
              <span className="font-bold text-purple-600">+690 points</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">💬</span>
                <span className="font-medium">Community Posts</span>
              </div>
              <span className="font-bold text-blue-600">+350 points</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">✅</span>
                <span className="font-medium">Profile Verification</span>
              </div>
              <span className="font-bold text-green-600">+200 points</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-lg mr-2">🤝</span>
                <span className="font-medium">Community Engagement</span>
              </div>
              <span className="font-bold text-orange-600">+150 points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sampleActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="text-lg">{getActivityIcon(activity.type)}</div>
                <div className="flex-1">
                  <div className="font-medium">{activity.title}</div>
                  <div className="text-sm text-gray-600">{activity.timestamp}</div>
                  {activity.politician && (
                    <div className="text-sm text-purple-600">From {activity.politician}</div>
                  )}
                  {activity.engagement && (
                    <div className="text-sm text-gray-500">{activity.engagement}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Following */}
      <Card>
        <CardHeader>
          <CardTitle>Following Representatives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">DT</span>
              </div>
              <div>
                <div className="font-medium">Rep. Dina Titus</div>
                <div className="text-sm text-gray-600">Nevada District 1</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">SL</span>
              </div>
              <div>
                <div className="font-medium">Rep. Susie Lee</div>
                <div className="text-sm text-gray-600">Nevada District 3</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">CCM</span>
              </div>
              <div>
                <div className="font-medium">Sen. Catherine Cortez Masto</div>
                <div className="text-sm text-gray-600">Nevada</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-blue-600">JR</span>
              </div>
              <div>
                <div className="font-medium">Sen. Jacky Rosen</div>
                <div className="text-sm text-gray-600">Nevada</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}