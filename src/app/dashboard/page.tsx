import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CitizenDashboard from '@/components/dashboard/CitizenDashboard'
import PoliticianDashboard from '@/components/dashboard/PoliticianDashboard'
import VerificationRequired from '@/components/dashboard/VerificationRequired'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getCurrentUser()
  
  if (!user) {
    redirect('/login')
  }

  // If user needs ID verification (but keep it simple for MVP)
  if (user.verificationStatus === 'pending') {
    return (
      <DashboardLayout user={user}>
        <VerificationRequired user={user} />
      </DashboardLayout>
    )
  }

  // Route to appropriate dashboard based on role
  if (user.role === 'politician') {
    return (
      <DashboardLayout user={user}>
        <PoliticianDashboard user={user} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <CitizenDashboard user={user} />
    </DashboardLayout>
  )
}
