'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Users, CheckCircle, AlertCircle, ThumbsUp, ThumbsDown, BarChart3, Timer } from 'lucide-react';

// Types for our poll data
interface Poll {
  id: string;
  title: string;
  description?: string;
  poll_type: 'yes_no' | 'multiple_choice' | 'approval_rating' | 'ranked_choice';
  options?: {
    options?: string[];
    scale?: {
      min: number;
      max: number;
      labels?: Record<number, string>;
    };
  };
  politician: {
    first_name: string;
    last_name: string;
    office_title: string;
    office_level: string;
  };
  ends_at?: string;
  total_responses: number;
  is_active: boolean;
  status: string;
  show_results_before_vote: boolean;
  show_results_after_vote: boolean;
  created_at: string;
}

interface PollResults {
  response_distribution: any;
  demographic_breakdown: any;
  total_responses: number;
  response_rate: number;
  user_has_voted: boolean;
  time_remaining?: number;
}

interface PollVotingInterfaceProps {
  poll: Poll;
  initialResults?: PollResults;
  onVoteSubmitted?: (results: PollResults) => void;
}

export default function PollVotingInterface({ poll, initialResults, onVoteSubmitted }: PollVotingInterfaceProps) {
  const router = useRouter();
  const [results, setResults] = useState<PollResults | null>(initialResults || null);
  const [selectedAnswer, setSelectedAnswer] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasVoted, setHasVoted] = useState(initialResults?.user_has_voted || false);
  const [error, setError] = useState<string>('');
  const [responseStartTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    initialResults?.time_remaining || null
  );

  // Timer for poll end countdown
  useEffect(() => {
    if (!timeRemaining || timeRemaining <= 0) return;

    const interval = setInterval(() => {
      setTimeRemaining(prev => {
        if (!prev || prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeRemaining]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return 'Poll ended';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    if (minutes > 0) return `${minutes}m ${secs}s remaining`;
    return `${secs}s remaining`;
  };

  // Handle vote submission
  const handleSubmitVote = async () => {
    if (!selectedAnswer) {
      setError('Please select an answer before submitting');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const responseTime = Math.floor((Date.now() - responseStartTime) / 1000);
      
      const response = await fetch(`/api/polls/${poll.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poll_type: poll.poll_type,
          response_data: selectedAnswer,
          response_time_seconds: responseTime,
          device_info: {
            type: getDeviceType(),
            user_agent: navigator.userAgent.substring(0, 500)
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit vote');
      }

      const result = await response.json();
      
      setHasVoted(true);
      
      if (result.data?.poll_results) {
        setResults(result.data.poll_results);
        if (onVoteSubmitted) {
          onVoteSubmitted(result.data.poll_results);
        }
      }

    } catch (error) {
      console.error('Error submitting vote:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit vote');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get device type for analytics
  const getDeviceType = (): 'mobile' | 'desktop' | 'tablet' => {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) return 'mobile';
    return 'desktop';
  };

  // Render Yes/No voting interface
  const renderYesNoVoting = () => (
    <div className="space-y-4">
      {['yes', 'no', 'undecided'].map((option) => (
        <label
          key={option}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedAnswer?.answer === option
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="radio"
            name="vote"
            value={option}
            checked={selectedAnswer?.answer === option}
            onChange={() => setSelectedAnswer({ answer: option })}
            className="w-4 h-4 text-purple-600 mr-3"
          />
          <div className="flex items-center space-x-3">
            {option === 'yes' && <ThumbsUp className="w-5 h-5 text-green-500" />}
            {option === 'no' && <ThumbsDown className="w-5 h-5 text-red-500" />}
            {option === 'undecided' && <AlertCircle className="w-5 h-5 text-yellow-500" />}
            <span className="font-medium capitalize">{option}</span>
          </div>
        </label>
      ))}
    </div>
  );

  // Render multiple choice voting interface
  const renderMultipleChoiceVoting = () => (
    <div className="space-y-3">
      {poll.options?.options?.map((option, index) => (
        <label
          key={index}
          className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedAnswer?.selected?.includes(option)
              ? 'border-purple-500 bg-purple-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            type="checkbox"
            checked={selectedAnswer?.selected?.includes(option) || false}
            onChange={(e) => {
              const currentSelected = selectedAnswer?.selected || [];
              if (e.target.checked) {
                setSelectedAnswer({
                  selected: [...currentSelected, option],
                  primary: currentSelected.length === 0 ? option : selectedAnswer?.primary
                });
              } else {
                const newSelected = currentSelected.filter((s: string) => s !== option);
                setSelectedAnswer({
                  selected: newSelected,
                  primary: selectedAnswer?.primary === option ? newSelected[0] : selectedAnswer?.primary
                });
              }
            }}
            className="w-4 h-4 text-purple-600 mr-3"
          />
          <span className="font-medium">{option}</span>
        </label>
      )) || []}
    </div>
  );

  // Render approval rating voting interface
  const renderApprovalRatingVoting = () => {
    const scale = poll.options?.scale || { min: 1, max: 5, labels: {} };
    const ratings = Array.from({ length: scale.max - scale.min + 1 }, (_, i) => scale.min + i);

    return (
      <div className="space-y-3">
        {ratings.map((rating) => (
          <label
            key={rating}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedAnswer?.rating === rating
                ? 'border-purple-500 bg-purple-50'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="rating"
              value={rating}
              checked={selectedAnswer?.rating === rating}
              onChange={() => {
                const category = getCategoryFromRating(rating);
                setSelectedAnswer({ rating, category });
              }}
              className="w-4 h-4 text-purple-600 mr-3"
            />
            <div className="flex items-center space-x-3">
              <span className="font-bold text-lg w-8">{rating}</span>
              <span className="font-medium">
                {scale.labels?.[rating] || `Rating ${rating}`}
              </span>
            </div>
          </label>
        ))}
      </div>
    );
  };

  const getCategoryFromRating = (rating: number): string => {
    if (rating <= 1) return 'strongly_disapprove';
    if (rating <= 2) return 'disapprove';
    if (rating <= 3) return 'neutral';
    if (rating <= 4) return 'approve';
    return 'strongly_approve';
  };

  // Render results after voting
  const renderResults = () => {
    if (!results) return null;

    return (
      <div className="mt-8 p-6 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-semibold">Poll Results</h3>
        </div>

        <div className="space-y-4">
          {poll.poll_type === 'yes_no' && renderYesNoResults()}
          {poll.poll_type === 'multiple_choice' && renderMultipleChoiceResults()}
          {poll.poll_type === 'approval_rating' && renderApprovalRatingResults()}
          
          <div className="pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Total Responses:</span> {results.total_responses}
              </div>
              <div>
                <span className="font-medium">Response Rate:</span> {results.response_rate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderYesNoResults = () => {
    const distribution = results?.response_distribution || {};
    const total = Object.values(distribution).reduce((sum: number, count: any) => sum + (count || 0), 0);

    return (
      <div className="space-y-3">
        {Object.entries(distribution).map(([answer, count]: [string, any]) => {
          const percentage = total > 0 ? ((count / total) * 100) : 0;
          return (
            <div key={answer} className="flex items-center space-x-3">
              <div className="w-20 text-sm font-medium capitalize">{answer}:</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ${
                    answer === 'yes' ? 'bg-green-500' : 
                    answer === 'no' ? 'bg-red-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-sm text-gray-600">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderMultipleChoiceResults = () => {
    const distribution = results?.response_distribution || {};
    const total = Object.values(distribution).reduce((sum: number, count: any) => sum + (count || 0), 0);

    return (
      <div className="space-y-3">
        {Object.entries(distribution).map(([option, count]: [string, any]) => {
          const percentage = total > 0 ? ((count / total) * 100) : 0;
          return (
            <div key={option} className="flex items-center space-x-3">
              <div className="w-32 text-sm font-medium truncate">{option}:</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-sm text-gray-600">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderApprovalRatingResults = () => {
    const distribution = results?.response_distribution?.ratings || {};
    const total = Object.values(distribution).reduce((sum: number, count: any) => sum + (count || 0), 0);
    const average = results?.response_distribution?.average_rating || 0;

    return (
      <div className="space-y-3">
        <div className="text-center mb-4">
          <div className="text-2xl font-bold text-purple-600">{average.toFixed(1)}</div>
          <div className="text-sm text-gray-600">Average Rating</div>
        </div>
        
        {Object.entries(distribution).map(([rating, count]: [string, any]) => {
          const percentage = total > 0 ? ((count / total) * 100) : 0;
          return (
            <div key={rating} className="flex items-center space-x-3">
              <div className="w-12 text-sm font-medium">{rating} ⭐:</div>
              <div className="flex-1 bg-gray-200 rounded-full h-4">
                <div
                  className="h-4 bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-16 text-sm text-gray-600">
                {count} ({percentage.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Poll Header */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{poll.title}</h1>
            {poll.description && (
              <p className="text-purple-100 mb-3">{poll.description}</p>
            )}
            <div className="flex items-center space-x-4 text-purple-200 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>By {poll.politician.first_name} {poll.politician.last_name}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{poll.total_responses} responses</span>
              </div>
            </div>
          </div>
          
          {timeRemaining !== null && timeRemaining > 0 && (
            <div className="text-right">
              <div className="flex items-center space-x-1 text-purple-200">
                <Timer className="w-4 h-4" />
                <span className="text-sm">{formatTimeRemaining(timeRemaining)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Poll Content */}
      <div className="p-6">
        {!poll.is_active || poll.status !== 'active' ? (
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Poll Not Available</h3>
            <p className="text-gray-600">This poll is currently not active for voting.</p>
          </div>
        ) : timeRemaining === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Poll Ended</h3>
            <p className="text-gray-600">The voting period for this poll has ended.</p>
          </div>
        ) : hasVoted ? (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Vote Submitted</h3>
            <p className="text-gray-600">Thank you for participating in this poll!</p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold mb-4">Cast Your Vote</h2>
            
            {poll.poll_type === 'yes_no' && renderYesNoVoting()}
            {poll.poll_type === 'multiple_choice' && renderMultipleChoiceVoting()}
            {poll.poll_type === 'approval_rating' && renderApprovalRatingVoting()}
            {poll.poll_type === 'ranked_choice' && (
              <div className="text-center py-8 text-gray-500">
                Ranked choice voting coming soon!
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                onClick={handleSubmitVote}
                disabled={!selectedAnswer || isSubmitting}
                className="px-8 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>
          </div>
        )}

        {/* Show results if available and permitted */}
        {((hasVoted && poll.show_results_after_vote) || 
          (!hasVoted && poll.show_results_before_vote) ||
          !poll.is_active) && renderResults()}
      </div>
    </div>
  );
}
