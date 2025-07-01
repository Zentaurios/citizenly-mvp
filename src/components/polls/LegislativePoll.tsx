'use client';

import { useState, useEffect } from 'react';
import { Clock, Users, ExternalLink } from 'lucide-react';
import PollVoting from './PollVoting';
import PollResults from './PollResults';

// ============================================================================
// TYPES
// ============================================================================

interface PollData {
  id: string;
  bill_id: number;
  question: string;
  target_districts: string[];
  expires_at: string;
  created_at: string;
  total_responses: number;
  is_active: boolean;
  poll_url: string;
  politician: {
    id: string;
    name: string;
    title: string;
  };
}

interface VoteStatus {
  has_voted: boolean;
  can_vote: boolean;
  poll_active: boolean;
  time_remaining: number | null;
  poll_info: {
    question: string;
    bill_id: number;
    total_responses: number;
  };
  results?: {
    approve_count: number;
    disapprove_count: number;
    no_opinion_count: number;
    total_responses: number;
  };
}

interface LegislativePollProps {
  poll: PollData;
  showDetails?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function LegislativePoll({ 
  poll, 
  showDetails = true, 
  className = '' 
}: LegislativePollProps) {
  const [voteStatus, setVoteStatus] = useState<VoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // FETCH VOTE STATUS
  // ============================================================================

  const fetchVoteStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/legislative-polls/${poll.id}/vote`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch vote status');
      }

      const data = await response.json();
      setVoteStatus(data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching vote status:', err);
      setError('Failed to load poll status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteStatus();
  }, [poll.id]);

  // ============================================================================
  // HANDLE VOTE SUBMISSION
  // ============================================================================

  const handleVoteSubmitted = (newVoteStatus: VoteStatus) => {
    setVoteStatus(newVoteStatus);
  };

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const formatTimeRemaining = (timeRemaining: number | null) => {
    if (!timeRemaining || timeRemaining <= 0) return 'Expired';
    
    const hours = Math.floor(timeRemaining / 3600);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      const minutes = Math.floor(timeRemaining / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
  };

  const formatDistrictsText = (districts: string[]) => {
    if (districts.length === 1) {
      return `District ${districts[0]}`;
    } else if (districts.length === 2) {
      return `Districts ${districts.join(' & ')}`;
    } else {
      return `${districts.length} districts`;
    }
  };

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className={`border border-gray-200 rounded-lg p-6 bg-white ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="flex space-x-3">
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
            <div className="h-10 bg-gray-200 rounded flex-1"></div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return (
      <div className={`border border-red-200 rounded-lg p-6 bg-red-50 ${className}`}>
        <div className="text-red-600 font-medium mb-2">Failed to Load Poll</div>
        <div className="text-red-500 text-sm mb-4">{error}</div>
        <button
          onClick={fetchVoteStatus}
          className="text-red-600 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!voteStatus) {
    return null;
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={`border border-gray-200 rounded-lg bg-white overflow-hidden ${className}`}>
      {/* Poll Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center text-xs text-gray-500 mb-2">
              <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium mr-2">
                POLL
              </span>
              <span>Bill #{poll.bill_id}</span>
              <span className="mx-2">•</span>
              <span>{formatDistrictsText(poll.target_districts)}</span>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {voteStatus.poll_info.question}
            </h3>
            
            <div className="flex items-center text-sm text-gray-600 space-x-4">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{voteStatus.poll_info.total_responses} responses</span>
              </div>
              
              {voteStatus.time_remaining !== null && (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  <span>{formatTimeRemaining(voteStatus.time_remaining)}</span>
                </div>
              )}
            </div>
          </div>
          
          {showDetails && (
            <a
              href={`/bills/${poll.bill_id}`}
              className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="View bill details"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Politician Info */}
        <div className="flex items-center text-sm text-gray-600">
          <span>Asked by </span>
          <span className="font-medium text-gray-900 ml-1">
            {poll.politician.title} {poll.politician.name}
          </span>
        </div>
      </div>

      {/* Poll Content */}
      <div className="p-6">
        {voteStatus.has_voted ? (
          <PollResults
            results={voteStatus.results}
            totalResponses={voteStatus.poll_info.total_responses}
            showPercentages={true}
          />
        ) : voteStatus.can_vote && voteStatus.poll_active ? (
          <PollVoting
            pollId={poll.id}
            onVoteSubmitted={handleVoteSubmitted}
          />
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">
              {!voteStatus.poll_active ? 'This poll has ended' : 'You are not eligible to vote on this poll'}
            </div>
            {voteStatus.results && (
              <PollResults
                results={voteStatus.results}
                totalResponses={voteStatus.poll_info.total_responses}
                showPercentages={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}