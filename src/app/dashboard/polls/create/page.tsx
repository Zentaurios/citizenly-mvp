import { Suspense } from 'react';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PollCreationForm from '@/components/polls/PollCreationForm';

export const dynamic = 'force-dynamic'

export default async function CreatePollPage() {
  const session = await auth();
  
  if (!session) {
    redirect('/login');
  }

  // Only politicians can create polls
  if (session.user.role !== 'politician') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        </div>
      }>
        <PollCreationForm />
      </Suspense>
    </div>
  );
}
