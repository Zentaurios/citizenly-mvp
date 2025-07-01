import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/actions/auth'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PublicPoliticianProfile from '@/components/profile/PublicPoliticianProfile'

// Sample politician data - in real app this would come from database
const politicianProfiles = {
  'dina-titus': {
    id: 'dina-titus',
    firstName: 'Dina',
    lastName: 'Titus',
    title: 'U.S. Representative',
    party: 'Democrat',
    district: 'Nevada District 1',
    office: 'House of Representatives',
    yearElected: 2013,
    committees: ['Veterans Affairs', 'Transportation & Infrastructure'],
    activePolls: 5,
    billsSponsored: 47,
    votingAttendance: 89,
    bio: 'Representative Titus serves Nevada\'s 1st congressional district and is a strong advocate for veterans, infrastructure, and renewable energy.',
    priorities: ['Veterans Affairs', 'Infrastructure', 'Renewable Energy', 'Tourism'],
    role: 'politician'
  },
  'susie-lee': {
    id: 'susie-lee',
    firstName: 'Susie',
    lastName: 'Lee',
    title: 'U.S. Representative',
    party: 'Democrat',
    district: 'Nevada District 3',
    office: 'House of Representatives',
    yearElected: 2019,
    committees: ['Education & Labor', 'Veterans Affairs'],
    activePolls: 8,
    billsSponsored: 32,
    votingAttendance: 94,
    bio: 'Representative Lee focuses on education, healthcare, and economic opportunities for Nevada families.',
    priorities: ['Education', 'Healthcare', 'Small Business', 'Housing'],
    role: 'politician'
  },
  'mark-amodei': {
    id: 'mark-amodei',
    firstName: 'Mark',
    lastName: 'Amodei',
    title: 'U.S. Representative',
    party: 'Republican',
    district: 'Nevada District 2',
    office: 'House of Representatives',
    yearElected: 2011,
    committees: ['Appropriations', 'Natural Resources'],
    activePolls: 3,
    billsSponsored: 28,
    votingAttendance: 91,
    bio: 'Representative Amodei represents Nevada\'s rural communities and focuses on natural resources and fiscal responsibility.',
    priorities: ['Natural Resources', 'Mining', 'Agriculture', 'Fiscal Policy'],
    role: 'politician'
  },
  'steven-horsford': {
    id: 'steven-horsford',
    firstName: 'Steven',
    lastName: 'Horsford',
    title: 'U.S. Representative',
    party: 'Democrat',
    district: 'Nevada District 4',
    office: 'House of Representatives',
    yearElected: 2018,
    committees: ['Ways & Means', 'Budget'],
    activePolls: 6,
    billsSponsored: 39,
    votingAttendance: 92,
    bio: 'Representative Horsford champions economic development, healthcare access, and educational opportunities.',
    priorities: ['Economic Development', 'Healthcare', 'Education', 'Criminal Justice Reform'],
    role: 'politician'
  },
  'catherine-cortez-masto': {
    id: 'catherine-cortez-masto',
    firstName: 'Catherine',
    lastName: 'Cortez Masto',
    title: 'U.S. Senator',
    party: 'Democrat',
    district: 'Nevada',
    office: 'Senate',
    yearElected: 2017,
    committees: ['Banking', 'Energy & Natural Resources', 'Indian Affairs'],
    activePolls: 4,
    billsSponsored: 67,
    votingAttendance: 96,
    bio: 'Senator Cortez Masto is the first Latina elected to the U.S. Senate and advocates for working families, clean energy, and immigration reform.',
    priorities: ['Immigration', 'Clean Energy', 'Banking Reform', 'Native American Issues'],
    role: 'politician'
  },
  'jacky-rosen': {
    id: 'jacky-rosen',
    firstName: 'Jacky',
    lastName: 'Rosen',
    title: 'U.S. Senator',
    party: 'Democrat',
    district: 'Nevada',
    office: 'Senate',
    yearElected: 2019,
    committees: ['Armed Services', 'Health Education Labor & Pensions', 'Small Business'],
    activePolls: 7,
    billsSponsored: 43,
    votingAttendance: 97,
    bio: 'Senator Rosen focuses on healthcare, cybersecurity, and supporting Nevada\'s military families and small businesses.',
    priorities: ['Healthcare', 'Cybersecurity', 'Military Families', 'Small Business'],
    role: 'politician'
  }
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = await params
  
  const politicianData = politicianProfiles[resolvedParams.id as keyof typeof politicianProfiles]
  
  if (!politicianData) {
    redirect('/representatives')
  }

  // For MVP: Politician profiles are now public via middleware
  const user = await getCurrentUser()
  
  // Use authenticated user if available, otherwise create guest user
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
      <PublicPoliticianProfile politician={politicianData} currentUser={currentUser} />
    </DashboardLayout>
  )
}