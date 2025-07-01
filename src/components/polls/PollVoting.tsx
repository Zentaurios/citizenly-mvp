'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, Minus, CheckCircle, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

type VoteOption = 'approve' | 'disapprove' | 'no_opinion';

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

interface PollVotingProps {
  pollId: string;
  onVoteSubmitted: (voteStatus: VoteStatus) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PollVoting({ pollId, onVoteSubmitted }: PollVotingProps) {
  const [selectedVote, setSelectedVote] = useState<VoteOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [startTime] = useState<number>(Date.now());

  // ============================================================================
  // VOTE SUBMISSION
  // ============================================================================

  const submitVote = async (vote: VoteOption) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const responseTimeSeconds = Math.floor((Date.now() - startTime) / 1000);
      
      const response = await fetch(`/api/legislative-polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          response: vote,
          response_time_seconds: responseTimeSeconds
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit vote');
      }

      if (data.success) {
        setSuccess(true);
        
        // Create updated vote status from response
        const updatedVoteStatus: VoteStatus = {
          has_voted: true,
          can_vote: false,
          poll_active: true,
          time_remaining: null,
          poll_info: {
            question: '',
            bill_id: 0,
            total_responses: data.data.poll_results?.total_responses || 0
          },
          results: data.data.poll_results ? {
            approve_count: data.data.poll_results.approve_count,
            disapprove_count: data.data.poll_results.disapprove_count,
            no_opinion_count: data.data.poll_results.no_opinion_count,
            total_responses: data.data.poll_results.total_responses
          } : undefined
        };

        // Wait a moment to show success, then notify parent
        setTimeout(() => {
          onVoteSubmitted(updatedVoteStatus);
        }, 1500);
      }
    } catch (err) {
      console.error('Error submitting vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteClick = (vote: VoteOption) => {
    if (isSubmitting || success) return;
    
    setSelectedVote(vote);
    submitVote(vote);
  };

  // ============================================================================
  // VOTE OPTIONS CONFIG
  // ============================================================================

  const voteOptions = [
    {
      key: 'approve' as const,
      label: 'Approve',
      icon: ThumbsUp,
      description: 'I support this bill',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      hoverColor: 'hover:bg-green-100',
      selectedColor: 'bg-green-100 border-green-400'
    },
    {
      key: 'disapprove' as const,
      label: 'Disapprove', 
      icon: ThumbsDown,
      description: 'I oppose this bill',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-700',
      hoverColor: 'hover:bg-red-100',
      selectedColor: 'bg-red-100 border-red-400'
    },
    {
      key: 'no_opinion' as const,
      label: 'No Opinion',
      icon: Minus,
      description: 'I need more information',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-700',
      hoverColor: 'hover:bg-gray-100',
      selectedColor: 'bg-gray-100 border-gray-400'
    }
  ];

  // ============================================================================
  // SUCCESS STATE
  // ============================================================================

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Vote Submitted!
        </h3>
        <p className="text-gray-600 mb-4">
          Thank you for participating in this legislative poll.
        </p>
        <div className="text-sm text-gray-500">
          Loading results...
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div>
      {/* Instructions */}
      <div className="text-center mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          What's your position?
        </h4>
        <p className="text-gray-600 text-sm">
          Your vote helps representatives understand constituent opinion on this legislation.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <div className="text-red-700 font-medium">Error</div>
          </div>
          <div className="text-red-600 text-sm mt-1">{error}</div>
        </div>
      )}

      {/* Vote Options */}
      <div className="space-y-3">
        {voteOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedVote === option.key;
          const isDisabled = isSubmitting;
          
          return (
            <button
              key={option.key}
              onClick={() => handleVoteClick(option.key)}
              disabled={isDisabled}
              className={`
                w-full p-4 border-2 rounded-lg text-left transition-all duration-200
                ${isSelected ? option.selectedColor : `${option.bgColor} ${option.borderColor}`}
                ${!isDisabled && !isSelected ? option.hoverColor : ''}
                ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isSubmitting && isSelected ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex items-center">
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-lg mr-4
                  ${isSelected ? 'bg-white' : option.bgColor}
                `}>
                  {isSubmitting && isSelected ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                  ) : (
                    <Icon className={`w-6 h-6 ${option.textColor}`} />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className={`font-semibold ${option.textColor}`}>
                    {option.label}
                  </div>
                  <div className="text-gray-600 text-sm mt-1">
                    {option.description}
                  </div>
                </div>

                {isSubmitting && isSelected && (
                  <div className="text-sm text-gray-500 ml-2">
                    Submitting...
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          Your vote is anonymous and secure. Results may be shared with representatives.
        </div>
      </div>
    </div>
  );
}