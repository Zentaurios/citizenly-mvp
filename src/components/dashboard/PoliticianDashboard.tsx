import { AuthUser } from '@/lib/database/types'
import EnhancedPoliticianDashboard from './EnhancedPoliticianDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  BarChart3, 
  Plus, 
  TrendingUp,
  Calendar,
  MapPin,
  Crown,
  Eye
} from 'lucide-react'

interface PoliticianDashboardProps {
  user: AuthUser
}

export default function PoliticianDashboard({ user }: PoliticianDashboardProps) {
  // For now, let's use the enhanced dashboard for verified politicians
  // and keep the simple one for unverified politicians
  if (user.verification_status === 'verified') {
    return <EnhancedPoliticianDashboard user={user} />
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome, {user.firstName}!
          </h1>
          <p className="text-gray-600">
            Connect with your constituents and gather valuable feedback.
          </p>
        </div>
        <Button className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Poll
        </Button>
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
                <div className="text-2xl font-bold text-gray-900">2,847</div>
                <div className="text-sm text-gray-500">Verified Constituents</div>
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
                <div className="text-2xl font-bold text-gray-900">5</div>
                <div className="text-sm text-gray-500">Active Polls</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">74%</div>
                <div className="text-sm text-gray-500">Response Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">1,204</div>
                <div className="text-sm text-gray-500">Total Responses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Premium Access Banner */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-amber-600 mr-3" />
              <div>
                <div className="font-semibold text-amber-900">
                  Upgrade to Premium Access
                </div>
                <div className="text-sm text-amber-700">
                  Get nationwide poll data and advanced analytics for $10,000/year
                </div>
              </div>
            </div>
            <Button variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Polls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Your Active Polls
              </span>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                New Poll
              </Button>
            </CardTitle>
            <CardDescription>
              Current polls open for constituent feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border border-green-200 bg-green-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-green-900">
                    Infrastructure Investment Priorities
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Which infrastructure projects should be prioritized?
                  </div>
                </div>
                <div className="text-sm text-green-600 font-medium">
                  847 responses
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-green-600">
                  Ends in 3 days • 74% response rate
                </div>
                <Button size="sm" variant="outline">View Results</Button>
              </div>
            </div>

            <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-blue-900">
                    Education Budget Allocation
                  </div>
                  <div className="text-sm text-blue-700 mt-1">
                    How should education funds be distributed?
                  </div>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  234 responses
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-xs text-blue-600">
                  Ends in 7 days • 23% response rate
                </div>
                <Button size="sm" variant="outline">View Results</Button>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="ghost" className="w-full">
                View All Polls
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Recent Responses
            </CardTitle>
            <CardDescription>
              Latest feedback from your constituents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  15 new responses to Infrastructure Poll
                </div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  Poll response rate increased to 74%
                </div>
                <div className="text-xs text-gray-500">4 hours ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
              <div className="flex-1">
                <div className="text-sm font-medium">
                  New constituent verified in your district
                </div>
                <div className="text-xs text-gray-500">1 day ago</div>
              </div>
            </div>
            <div className="pt-2">
              <Button variant="ghost" className="w-full">
                View All Activity
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Constituency Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Your Constituency
            </CardTitle>
            <CardDescription>
              Overview of your verified constituents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Total Verified</div>
                <div className="text-2xl font-bold text-gray-900">2,847</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Active Users</div>
                <div className="text-2xl font-bold text-gray-900">1,923</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-sm font-medium">Top Interests</div>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
                  Economy (68%)
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                  Infrastructure (54%)
                </span>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                  Education (49%)
                </span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                  Healthcare (41%)
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full">
                View Demographics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Performance Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Your engagement metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Response Rate</span>
                <span className="font-medium">74%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '74%' }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Constituent Engagement</span>
                <span className="font-medium">68%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Poll Completion Rate</span>
                <span className="font-medium">82%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="outline" className="w-full">
                View Detailed Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verification Status */}
      {user.verificationStatus !== 'verified' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="ml-4 flex-1">
                <div className="font-medium text-yellow-900">
                  Account Verification Pending
                </div>
                <div className="text-sm text-yellow-700">
                  Complete your verification to access all politician features and create polls.
                </div>
              </div>
              <Button variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100">
                Complete Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
