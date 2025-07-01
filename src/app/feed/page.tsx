import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SocialFeed from '@/components/feed/SocialFeed'

export const dynamic = 'force-dynamic'

export default async function FeedPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login?redirect=/feed')
  }

  return (
    <DashboardLayout user={user}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Community Feed</h1>
          <p className="text-gray-600">Connect with fellow citizens and your representatives</p>
        </div>
        <SocialFeed user={user} />
      </div>
    </DashboardLayout>
  )
}