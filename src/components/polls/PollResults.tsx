'use client';

import { ThumbsUp, ThumbsDown, Minus, Users } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PollResultsData {
  approve_count: number;
  disapprove_count: number;
  no_opinion_count: number;
  total_responses: number;
}

interface PollResultsProps {
  results?: PollResultsData;
  totalResponses: number;
  showPercentages?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function PollResults({
  results,
  totalResponses,
  showPercentages = true,
  className = ''
}: PollResultsProps) {
  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  // Use provided results or create empty results
  const data = results || {
    approve_count: 0,
    disapprove_count: 0,
    no_opinion_count: 0,
    total_responses: totalResponses || 0
  };

  // Calculate percentages
  const total = data.total_responses || 1; // Avoid division by zero
  const approvePercent = Math.round((data.approve_count / total) * 100);
  const disapprovePercent = Math.round((data.disapprove_count / total) * 100);
  const noOpinionPercent = Math.round((data.no_opinion_count / total) * 100);

  // Determine winner
  const getWinner = () => {
    if (data.approve_count > data.disapprove_count && data.approve_count > data.no_opinion_count) {
      return 'approve';
    } else if (data.disapprove_count > data.approve_count && data.disapprove_count > data.no_opinion_count) {
      return 'disapprove';
    } else if (data.no_opinion_count > data.approve_count && data.no_opinion_count > data.disapprove_count) {
      return 'no_opinion';
    }
    return 'tie';
  };

  const winner = getWinner();

  // ============================================================================
  // RESULT OPTIONS CONFIG
  // ============================================================================

  const resultOptions = [
    {
      key: 'approve',
      label: 'Approve',
      icon: ThumbsUp,
      count: data.approve_count,
      percentage: approvePercent,
      color: 'green',
      bgColor: 'bg-green-500',
      lightBgColor: 'bg-green-50',
      textColor: 'text-green-700',
      isWinner: winner === 'approve'
    },
    {
      key: 'disapprove',
      label: 'Disapprove',
      icon: ThumbsDown,
      count: data.disapprove_count,
      percentage: disapprovePercent,
      color: 'red',
      bgColor: 'bg-red-500',
      lightBgColor: 'bg-red-50',
      textColor: 'text-red-700',
      isWinner: winner === 'disapprove'
    },
    {
      key: 'no_opinion',
      label: 'No Opinion',
      icon: Minus,
      count: data.no_opinion_count,
      percentage: noOpinionPercent,
      color: 'gray',
      bgColor: 'bg-gray-500',
      lightBgColor: 'bg-gray-50',
      textColor: 'text-gray-700',
      isWinner: winner === 'no_opinion'
    }
  ];

  // Sort by count for display order
  const sortedResults = [...resultOptions].sort((a, b) => b.count - a.count);

  // ============================================================================
  // EMPTY STATE
  // ============================================================================

  if (data.total_responses === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-400 mb-2">
          <Users className="w-8 h-8 mx-auto mb-2" />
        </div>
        <div className="text-gray-600 font-medium mb-1">No votes yet</div>
        <div className="text-gray-500 text-sm">Be the first to share your opinion!</div>
      </div>
    );
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className={className}>
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-lg font-semibold text-gray-900 mb-1">
          Poll Results
        </div>
        <div className="text-gray-600 text-sm">
          {data.total_responses.toLocaleString()} {data.total_responses === 1 ? 'response' : 'responses'}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {sortedResults.map((option) => {
          const Icon = option.icon;
          
          return (
            <div
              key={option.key}
              className={`
                relative p-4 rounded-lg border transition-all duration-200
                ${option.isWinner 
                  ? 'border-2 border-blue-200 bg-blue-50' 
                  : 'border border-gray-200 bg-white'
                }
              `}
            >
              {/* Winner Badge */}
              {option.isWinner && (
                <div className="absolute -top-2 left-4">
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    LEADING
                  </span>
                </div>
              )}

              <div className="flex items-center">
                {/* Icon */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-lg mr-4
                  ${option.lightBgColor}
                `}>
                  <Icon className={`w-6 h-6 ${option.textColor}`} />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className={`font-semibold ${option.textColor}`}>
                      {option.label}
                    </span>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {option.count.toLocaleString()}
                      </div>
                      {showPercentages && (
                        <div className="text-sm text-gray-600">
                          {option.percentage}%
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${option.bgColor}`}
                      style={{ width: `${option.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          {winner === 'tie' ? (
            <div className="text-gray-600 text-sm">
              Results are currently tied
            </div>
          ) : (
            <div className="text-gray-600 text-sm">
              Majority position: <span className="font-medium text-gray-900">
                {resultOptions.find(o => o.key === winner)?.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Results are updated in real-time and may be shared with representatives.
      </div>
    </div>
  );
}