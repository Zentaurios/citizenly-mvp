import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/actions/auth';
import { LegislativeFeed } from '@/components/legislative/LegislativeFeed';
import { Card } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/DashboardLayout';

export const dynamic = 'force-dynamic'

export default async function LegislativePage() {
  // Verify authentication using the same method as dashboard
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/legislative');
  }

  // Check if user is verified
  if (user.verificationStatus !== 'verified') {
    return (
      <DashboardLayout user={user}>
        <div className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <div className="mx-auto w-16 h-16 mb-4 flex items-center justify-center bg-yellow-100 rounded-full">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Verification Required</h2>
            <p className="text-gray-600 mb-4">
              You need to complete identity verification to access legislative updates.
            </p>
            <p className="text-sm text-gray-500">
              Legislative feeds are only available to verified Nevada residents to ensure accurate district matching.
            </p>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout user={user}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nevada Legislative Feed</h1>
          <p className="text-gray-600 text-lg">
            Stay informed about legislative activity that affects your district and interests.
          </p>
        </div>

        <LegislativeFeed userId={user.id} />
      </div>
    </DashboardLayout>
  );
}