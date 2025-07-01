import { getCurrentUser } from '@/lib/actions/auth'
import { redirect } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import NotificationsPageSimple from '@/components/notifications/NotificationsPageSimple'

export default async function NotificationsPageRoute() {
  const user = await getCurrentUser()
  
  // For MVP: Allow visitors to view notifications demo without authentication
  const currentUser = user || {
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
    <DashboardLayout user={currentUser}>
      <NotificationsPageSimple user={currentUser} />
    </DashboardLayout>
  )
}