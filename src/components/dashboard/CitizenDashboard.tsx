import { AuthUser } from '@/lib/database/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LegislativeFeed } from '@/components/legislative/LegislativeFeed'
import { 
  Users, 
  BarChart3, 
  Bell, 
  MapPin,
  Calendar,
  TrendingUp,
  FileText
} from 'lucide-react'

interface CitizenDashboardProps {
  user: AuthUser
}

export default function CitizenDashboard({ user }: CitizenDashboardProps) {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user.firstName}!
        </h1>
        <p className="text-gray-600">
          Stay connected with your representatives and engage in democracy.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">4</div>
                <div className="text-sm text-gray-500">Representatives</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">2</div>
                <div className="text-sm text-gray-500">Active Polls</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Bell className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">3</div>
                <div className="text-sm text-gray-500">New Updates</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">87%</div>
                <div className="text-sm text-gray-500">Engagement</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Representatives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Your Representatives
            </CardTitle>
            <CardDescription>
              Based on your Nevada address verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Senator Catherine Cortez Masto</div>
                <div className="text-sm text-gray-500">U.S. Senate • Democrat</div>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Senator Jacky Rosen</div>
                <div className="text-sm text-gray-500">U.S. Senate • Democrat</div>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">Rep. Susie Lee</div>
                <div className="text-sm text-gray-500">U.S. House • District 3</div>
              </div>
              <Button variant="outline" size="sm">View</Button>
            </div>
            <div className="pt-2">
              <Button variant="ghost" className="w-full">
                View All Representatives
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Active Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Active Polls
            </CardTitle>
            <CardDescription>
              Polls from your representatives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-purple-200 bg-purple-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-purple-900">
                    Infrastructure Investment Poll
                  </div>
                  <div className="text-sm text-purple-700 mt-1">
                    Should Nevada invest in additional renewable energy infrastructure?
                  </div>
                  <div className="text-xs text-purple-600 mt-2">
                    From Rep. Susie Lee • Ends in 5 days
                  </div>
                </div>
                <Button size="sm">Vote</Button>
              </div>
            </div>

            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    Transportation Budget
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    What transportation projects should be prioritized?
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    From City Council • Ends in 2 days
                  </div>
                </div>
                <Button size="sm">Vote</Button>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="ghost" className="w-full">
                View All Polls
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Activity
            </CardTitle>
            <CardDescription>
              Latest updates from your representatives
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Senator Cortez Masto voted YES on Infrastructure Bill
                </div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  New poll created: Community Safety Priorities
                </div>
                <div className="text-xs text-gray-500">1 day ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-orange-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Rep. Lee sponsored new education funding bill
                </div>
                <div className="text-xs text-gray-500">3 days ago</div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="ghost" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* District Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Your District
            </CardTitle>
            <CardDescription>
              Based on your verified address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Congressional</div>
                <div className="font-medium">District 3</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">State Senate</div>
                <div className="font-medium">District 9</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Assembly</div>
                <div className="font-medium">District 21</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">County</div>
                <div className="font-medium">Clark</div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="outline" className="w-full">
                View District Map
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legislative Feed */}
      {user.verificationStatus === 'verified' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Nevada Legislative Updates
            </CardTitle>
            <CardDescription>
              Bills, votes, and legislative activity from your representatives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LegislativeFeed userId={user.id} className="max-w-none" />
          </CardContent>
        </Card>
      )}

      {/* Getting Started */}
      {user.verificationStatus === 'verified' && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Ready to Engage!</CardTitle>
            <CardDescription className="text-purple-700">
              Your account is verified. Here's how to get the most out of Citizenly:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4">
                <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-purple-900">Participate in Polls</div>
                <div className="text-sm text-purple-700">
                  Vote on issues that matter to you
                </div>
              </div>
              <div className="text-center p-4">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-purple-900">Follow Representatives</div>
                <div className="text-sm text-purple-700">
                  Stay updated on their activity
                </div>
              </div>
              <div className="text-center p-4">
                <Bell className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="font-medium text-purple-900">Get Notifications</div>
                <div className="text-sm text-purple-700">
                  Never miss important updates
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
