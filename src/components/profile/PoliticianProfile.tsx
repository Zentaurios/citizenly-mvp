import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Building, Users, BarChart3, Calendar, TrendingUp, ExternalLink } from 'lucide-react'
import { Button } from '../ui/button'

export default function PoliticianProfile({ user }: { user: any }) {
  // Sample politician data (replace with real LegiScan data)
  const sampleLegislativeData = [
    {
      type: 'bill_sponsored',
      title: 'Nevada Clean Energy Infrastructure Act',
      billNumber: 'AB 125',
      status: 'In Committee',
      timestamp: '1 week ago'
    },
    {
      type: 'vote_cast',
      title: 'Voted YES on Transportation Funding Bill',
      billNumber: 'SB 89',
      position: 'Support',
      timestamp: '2 weeks ago'
    },
    {
      type: 'committee_assignment',
      title: 'Appointed to Energy & Environment Committee',
      role: 'Vice Chair',
      timestamp: '1 month ago'
    },
    {
      type: 'bill_sponsored',
      title: 'Small Business Tax Relief Act',
      billNumber: 'AB 67',
      status: 'Passed Assembly',
      timestamp: '1 month ago'
    }
  ]

  const samplePolls = [
    {
      id: 'infrastructure-poll',
      question: 'Should Nevada invest more in renewable energy infrastructure?',
      responses: 1247,
      status: 'Active',
      createdAt: '3 days ago'
    },
    {
      id: 'education-poll', 
      question: 'What education priorities should receive additional funding?',
      responses: 892,
      status: 'Ended',
      createdAt: '1 week ago'
    },
    {
      id: 'transportation-poll',
      question: 'How should we prioritize transportation improvements?',
      responses: 543,
      status: 'Active',
      createdAt: '2 weeks ago'
    }
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bill_sponsored': return '📜'
      case 'vote_cast': return '🗳️'
      case 'committee_assignment': return '👥'
      default: return '📝'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <Building className="w-10 h-10 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                Rep. {user.firstName} {user.lastName}
              </h1>
              <div className="text-lg text-gray-600 mt-1">
                U.S. Representative • Nevada District 1
              </div>
              <div className="text-gray-600 mt-1">
                Democrat • Serving since 2013
              </div>
              <div className="flex items-center space-x-2 mt-3">
                <Badge variant="secondary">Verified Official</Badge>
                <Badge variant="outline">Energy Committee</Badge>
                <Badge variant="outline">Veterans Affairs</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">47</div>
            <div className="text-sm text-gray-600">Bills Sponsored</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">89%</div>
            <div className="text-sm text-gray-600">Voting Attendance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">12</div>
            <div className="text-sm text-gray-600">Active Polls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">2,847</div>
            <div className="text-sm text-gray-600">Constituents</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legislative Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Recent Legislative Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sampleLegislativeData.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className="mr-2">{getActivityIcon(item.type)}</span>
                        <div className="font-medium">{item.title}</div>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{item.timestamp}</div>
                      {item.billNumber && (
                        <Badge variant="outline" className="mt-1">{item.billNumber}</Badge>
                      )}
                      {item.status && (
                        <div className="text-sm text-blue-600 mt-1">Status: {item.status}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Constituent Polls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {samplePolls.map((poll) => (
                <div key={poll.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="font-medium text-sm mb-2">{poll.question}</div>
                  <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                    <span>{poll.responses} responses</span>
                    <Badge variant={poll.status === 'Active' ? 'default' : 'secondary'}>
                      {poll.status}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-500">{poll.createdAt}</div>
                  {poll.status === 'Active' && (
                    <Button size="sm" className="mt-2 w-full">
                      View Results
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Create New Poll
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Committee Assignments */}
      <Card>
        <CardHeader>
          <CardTitle>Committee Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="font-medium">Energy and Commerce Committee</div>
              <div className="text-sm text-gray-600">Ranking Member</div>
              <div className="text-xs text-gray-500 mt-1">House Committee</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-medium">Veterans' Affairs Committee</div>
              <div className="text-sm text-gray-600">Member</div>
              <div className="text-xs text-gray-500 mt-1">House Committee</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="font-medium">Transportation and Infrastructure</div>
              <div className="text-sm text-gray-600">Member</div>
              <div className="text-xs text-gray-500 mt-1">House Committee</div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg">
              <div className="font-medium">Small Business Committee</div>
              <div className="text-sm text-gray-600">Vice Chair</div>
              <div className="text-xs text-gray-500 mt-1">House Committee</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voting Record Highlights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Key Votes & Positions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium">Infrastructure Investment Act</div>
                <div className="text-sm text-gray-600">HR 3684 - November 2021</div>
              </div>
              <Badge className="bg-green-100 text-green-800">YES</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div>
                <div className="font-medium">Climate Action Now Act</div>
                <div className="text-sm text-gray-600">HR 9 - May 2021</div>
              </div>
              <Badge className="bg-green-100 text-green-800">YES</Badge>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <div className="font-medium">Small Business Relief Act</div>
                <div className="text-sm text-gray-600">HR 1319 - March 2021</div>
              </div>
              <Badge className="bg-green-100 text-green-800">YES</Badge>
            </div>
          </div>
          <Button variant="outline" className="w-full mt-4">
            <ExternalLink className="w-4 h-4 mr-2" />
            View Full Voting Record
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}