import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PoliticianDashboard from '@/components/polls/PoliticianDashboard';

export const dynamic = 'force-dynamic'

export default async function PollsDashboardPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  // Only politicians can access the polls dashboard
  if (session.user.role !== 'politician') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }>
        <PoliticianDashboard />
      </Suspense>
    </div>
  );
}
