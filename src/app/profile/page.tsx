import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CitizenProfile from '@/components/profile/CitizenProfile'
import PoliticianProfile from '@/components/profile/PoliticianProfile'

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login?redirect=/profile')
  }

  return (
    <DashboardLayout user={user}>
      {user.role === 'politician' ? (
        <PoliticianProfile user={user} />
      ) : (
        <CitizenProfile user={user} />
      )}
    </DashboardLayout>
  )
}