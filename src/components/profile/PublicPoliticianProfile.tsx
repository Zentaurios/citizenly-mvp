import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Building, Users, BarChart3, Calendar, TrendingUp, ExternalLink, ArrowLeft, MapPin, Phone, Mail } from 'lucide-react'

interface PoliticianData {
  id: string
  firstName: string
  lastName: string
  title: string
  party: string
  district: string
  office: string
  yearElected: number
  committees: string[]
  activePolls: number
  billsSponsored: number
  votingAttendance: number
  bio: string
  priorities: string[]
  role: string
}

export default function PublicPoliticianProfile({ 
  politician, 
  currentUser 
}: { 
  politician: PoliticianData
  currentUser: any 
}) {
  // Sample legislative activity data
  const sampleLegislativeData = [
    {
      type: 'bill_sponsored',
      title: 'Nevada Clean Energy Infrastructure Act',
      billNumber: 'AB 125',
      status: 'In Committee',
      timestamp: '1 week ago',
      description: 'Promotes renewable energy development across Nevada with tax incentives for solar and wind projects.'
    },
    {
      type: 'vote_cast',
      title: 'Infrastructure Investment and Jobs Act',
      billNumber: 'HR 3684',
      position: 'YES',
      timestamp: '2 weeks ago',
      description: 'Voted to support $1.2 trillion in infrastructure improvements nationwide.'
    },
    {
      type: 'committee_hearing',
      title: 'Veterans Affairs Committee Hearing',
      topic: 'Mental Health Services',
      timestamp: '3 weeks ago',
      description: 'Participated in hearing on expanding mental health services for Nevada veterans.'
    },
    {
      type: 'bill_cosponsored',
      title: 'Small Business Relief Act',
      billNumber: 'SB 67',
      status: 'Passed',
      timestamp: '1 month ago',
      description: 'Co-sponsored legislation providing tax relief for small businesses affected by the pandemic.'
    }
  ]

  const samplePolls = [
    {
      id: 'infrastructure-poll',
      question: 'Should Nevada prioritize renewable energy infrastructure over traditional energy sources?',
      responses: 1247,
      status: 'Active',
      createdAt: '3 days ago',
      endDate: '7 days remaining'
    },
    {
      id: 'education-poll', 
      question: 'What should be the top priority for education funding in Nevada?',
      responses: 892,
      status: 'Ended',
      createdAt: '1 week ago',
      results: 'Teacher salaries (45%), School infrastructure (32%), Technology (23%)'
    },
    {
      id: 'healthcare-poll',
      question: 'How can we improve healthcare access in rural Nevada communities?',
      responses: 543,
      status: 'Active',
      createdAt: '2 weeks ago',
      endDate: '3 days remaining'
    }
  ]

  const getPartyColor = (party: string) => {
    return party === 'Democrat' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bill_sponsored': return '📜'
      case 'vote_cast': return '🗳️'
      case 'committee_hearing': return '👥'
      case 'bill_cosponsored': return '🤝'
      default: return '📝'
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-2">
        <Link href="/representatives" className="flex items-center text-purple-600 hover:text-purple-800">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Representatives
        </Link>
      </div>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Building className="w-12 h-12 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {politician.title} {politician.firstName} {politician.lastName}
              </h1>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getPartyColor(politician.party)}>{politician.party}</Badge>
                <Badge variant="outline">{politician.office}</Badge>
                <Badge variant="secondary">Verified Official</Badge>
              </div>
              <div className="flex items-center space-x-4 mt-3 text-gray-600">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{politician.district}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>Serving since {politician.yearElected}</span>
                </div>
              </div>
              <p className="text-gray-600 mt-3">{politician.bio}</p>
              
              {/* Quick Actions */}
              <div className="flex space-x-2 mt-4">
                <Button variant="default">
                  <Users className="w-4 h-4 mr-1" />
                  Follow
                </Button>
                <Button variant="outline">
                  <Mail className="w-4 h-4 mr-1" />
                  Contact
                </Button>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  View All Polls
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">{politician.billsSponsored}</div>
            <div className="text-sm text-gray-600">Bills Sponsored</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{politician.votingAttendance}%</div>
            <div className="text-sm text-gray-600">Voting Attendance</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">{politician.activePolls}</div>
            <div className="text-sm text-gray-600">Active Polls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">2,847</div>
            <div className="text-sm text-gray-600">Followers</div>
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
                      <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="text-xs text-gray-500">{item.timestamp}</span>
                        {item.billNumber && (
                          <Badge variant="outline" className="text-xs">{item.billNumber}</Badge>
                        )}
                        {item.status && (
                          <Badge variant="secondary" className="text-xs">{item.status}</Badge>
                        )}
                        {item.position && (
                          <Badge className={`text-xs ${
                            item.position === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {item.position}
                          </Badge>
                        )}
                      </div>
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
              Polls for Constituents
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
                  <div className="text-xs text-gray-500 mb-2">Created {poll.createdAt}</div>
                  {poll.status === 'Active' ? (
                    <div className="space-y-2">
                      <div className="text-xs text-blue-600">{poll.endDate}</div>
                      <Button size="sm" className="w-full">
                        Participate Now
                      </Button>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                      Results: {poll.results}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Committee Assignments & Priorities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Committee Assignments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {politician.committees.map((committee, index) => (
                <div key={index} className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium">{committee}</div>
                  <div className="text-sm text-gray-600">
                    {index === 0 ? 'Ranking Member' : 'Member'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Policy Priorities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {politician.priorities.map((priority, index) => (
                <Badge key={index} variant="outline" className="justify-center py-2">
                  {priority}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="w-5 h-5 mr-2" />
            Contact Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Washington, D.C. Office</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Phone: (202) 225-5965</p>
                <p>Address: 2464 Rayburn House Office Building</p>
                <p>Washington, DC 20515</p>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Nevada Office</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Phone: (702) 220-9823</p>
                <p>Address: 8872 S Eastern Ave, Suite 220</p>
                <p>Las Vegas, NV 89123</p>
              </div>
            </div>
          </div>
          <div className="flex space-x-2 mt-4">
            <Button variant="outline" className="flex-1">
              <Mail className="w-4 h-4 mr-1" />
              Send Email
            </Button>
            <Button variant="outline" className="flex-1">
              <ExternalLink className="w-4 h-4 mr-1" />
              Official Website
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}