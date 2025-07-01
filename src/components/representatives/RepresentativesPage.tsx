'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Users, Building, MapPin, Calendar, ExternalLink, BarChart3 } from 'lucide-react'

export default function RepresentativesPage({ user }: { user: any }) {
  // Sample Nevada representatives data
  const nevadaRepresentatives = [
    {
      id: 'dina-titus',
      name: 'Dina Titus',
      title: 'U.S. Representative',
      party: 'Democrat',
      district: 'Nevada District 1',
      office: 'House of Representatives',
      yearElected: 2013,
      image: '/api/placeholder/64/64',
      committees: ['Veterans Affairs', 'Transportation & Infrastructure'],
      activePolls: 5,
      billsSponsored: 47,
      votingAttendance: 89,
      bio: 'Representative Titus serves Nevada\'s 1st congressional district and is a strong advocate for veterans, infrastructure, and renewable energy.',
      priorities: ['Veterans Affairs', 'Infrastructure', 'Renewable Energy', 'Tourism']
    },
    {
      id: 'susie-lee',
      name: 'Susie Lee',
      title: 'U.S. Representative',
      party: 'Democrat',
      district: 'Nevada District 3',
      office: 'House of Representatives',
      yearElected: 2019,
      image: '/api/placeholder/64/64',
      committees: ['Education & Labor', 'Veterans Affairs'],
      activePolls: 8,
      billsSponsored: 32,
      votingAttendance: 94,
      bio: 'Representative Lee focuses on education, healthcare, and economic opportunities for Nevada families.',
      priorities: ['Education', 'Healthcare', 'Small Business', 'Housing']
    },
    {
      id: 'mark-amodei',
      name: 'Mark Amodei',
      title: 'U.S. Representative',
      party: 'Republican',
      district: 'Nevada District 2',
      office: 'House of Representatives',
      yearElected: 2011,
      image: '/api/placeholder/64/64',
      committees: ['Appropriations', 'Natural Resources'],
      activePolls: 3,
      billsSponsored: 28,
      votingAttendance: 91,
      bio: 'Representative Amodei represents Nevada\'s rural communities and focuses on natural resources and fiscal responsibility.',
      priorities: ['Natural Resources', 'Mining', 'Agriculture', 'Fiscal Policy']
    },
    {
      id: 'steven-horsford',
      name: 'Steven Horsford',
      title: 'U.S. Representative',
      party: 'Democrat',
      district: 'Nevada District 4',
      office: 'House of Representatives',
      yearElected: 2018,
      image: '/api/placeholder/64/64',
      committees: ['Ways & Means', 'Budget'],
      activePolls: 6,
      billsSponsored: 39,
      votingAttendance: 92,
      bio: 'Representative Horsford champions economic development, healthcare access, and educational opportunities.',
      priorities: ['Economic Development', 'Healthcare', 'Education', 'Criminal Justice Reform']
    },
    {
      id: 'catherine-cortez-masto',
      name: 'Catherine Cortez Masto',
      title: 'U.S. Senator',
      party: 'Democrat',
      district: 'Nevada',
      office: 'Senate',
      yearElected: 2017,
      image: '/api/placeholder/64/64',
      committees: ['Banking', 'Energy & Natural Resources', 'Indian Affairs'],
      activePolls: 4,
      billsSponsored: 67,
      votingAttendance: 96,
      bio: 'Senator Cortez Masto is the first Latina elected to the U.S. Senate and advocates for working families, clean energy, and immigration reform.',
      priorities: ['Immigration', 'Clean Energy', 'Banking Reform', 'Native American Issues']
    },
    {
      id: 'jacky-rosen',
      name: 'Jacky Rosen',
      title: 'U.S. Senator',
      party: 'Democrat',
      district: 'Nevada',
      office: 'Senate',
      yearElected: 2019,
      image: '/api/placeholder/64/64',
      committees: ['Armed Services', 'Health Education Labor & Pensions', 'Small Business'],
      activePolls: 7,
      billsSponsored: 43,
      votingAttendance: 97,
      bio: 'Senator Rosen focuses on healthcare, cybersecurity, and supporting Nevada\'s military families and small businesses.',
      priorities: ['Healthcare', 'Cybersecurity', 'Military Families', 'Small Business']
    }
  ]

  const getPartyColor = (party: string) => {
    return party === 'Democrat' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
          <Users className="w-8 h-8 mr-3" />
          Nevada Representatives
        </h1>
        <p className="text-gray-600 mt-2">
          Connect with your elected officials, view their legislative activity, and participate in their polls.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-blue-600">6</div>
            <div className="text-sm text-gray-600">Total Representatives</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-green-600">33</div>
            <div className="text-sm text-gray-600">Active Polls</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-purple-600">256</div>
            <div className="text-sm text-gray-600">Bills Sponsored</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-3xl font-bold text-orange-600">93%</div>
            <div className="text-sm text-gray-600">Avg. Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Representatives Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {nevadaRepresentatives.map((rep) => (
          <Card key={rep.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                {/* Avatar */}
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Building className="w-8 h-8 text-blue-600" />
                </div>
                
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{rep.title} {rep.name}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getPartyColor(rep.party)}>{rep.party}</Badge>
                        <Badge variant="outline">{rep.office}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mt-2">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{rep.district}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>Serving since {rep.yearElected}</span>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4 text-center">
                    <div>
                      <div className="text-lg font-bold text-purple-600">{rep.activePolls}</div>
                      <div className="text-xs text-gray-600">Active Polls</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-blue-600">{rep.billsSponsored}</div>
                      <div className="text-xs text-gray-600">Bills</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-green-600">{rep.votingAttendance}%</div>
                      <div className="text-xs text-gray-600">Attendance</div>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                    {rep.bio}
                  </p>

                  {/* Priorities */}
                  <div className="flex flex-wrap gap-1 mt-3">
                    {rep.priorities.slice(0, 3).map((priority) => (
                      <Badge key={priority} variant="outline" className="text-xs">
                        {priority}
                      </Badge>
                    ))}
                    {rep.priorities.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{rep.priorities.length - 3} more
                      </Badge>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 mt-4">
                    <Link href={`/profiles/${rep.id}`} className="flex-1">
                      <Button variant="outline" className="w-full text-sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View Profile
                      </Button>
                    </Link>
                    <Button variant="default" className="flex-1 text-sm">
                      <BarChart3 className="w-4 h-4 mr-1" />
                      View Polls
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Your Representatives</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Federal Offices</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>U.S. Senate:</strong> Hart Senate Office Building, Washington, DC 20510</p>
                <p><strong>U.S. House:</strong> Rayburn House Office Building, Washington, DC 20515</p>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Local Offices</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Las Vegas:</strong> 8872 S Eastern Ave, Las Vegas, NV 89123</p>
                <p><strong>Reno:</strong> 8945 W Flamingo Rd, Las Vegas, NV 89147</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MVP Notice */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center">
            <Building className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <div className="font-medium text-purple-900">MVP Demo</div>
              <div className="text-sm text-purple-700">
                This page shows sample Nevada representatives. In the full version, data will be automatically updated from official sources and include all current elected officials.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}