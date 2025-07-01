import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import RepresentativesPage from '@/components/representatives/RepresentativesPage'

export default async function Representatives() {
  const user = await getCurrentUser()
  
  // For MVP: Allow visitors to view representatives without authentication
  if (!user) {
    // Create a minimal guest user object for MVP demo
    const guestUser = {
      id: 'guest',
      firstName: 'Guest',
      lastName: 'Visitor',
      email: 'guest@example.com',
      role: 'citizen',
      verificationStatus: 'unverified',
      emailVerified: false,
      isActive: true
    }
    
    return (
      <DashboardLayout user={guestUser}>
        <RepresentativesPage user={guestUser} />
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout user={user}>
      <RepresentativesPage user={user} />
    </DashboardLayout>
  )
}