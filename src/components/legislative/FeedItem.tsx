import { useState, useEffect } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import { Card } from '../ui/card';
import LegislativePoll from '../polls/LegislativePoll';

interface FeedItemProps {
  item: {
    id: string;
    type: string;
    title: string;
    description: string;
    action_date: string;
    bill_number?: string;
    bill_title?: string;
    vote_description?: string;
    legislator_name?: string;
    subjects: string[];
    districts: string[];
    metadata: any;
    created_at: string;
  };
}

export function FeedItem({ item }: FeedItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [polls, setPolls] = useState<any[]>([]);
  const [pollsLoading, setPollsLoading] = useState(false);
  const [pollsError, setPollsError] = useState<string | null>(null);

  // Extract bill ID from metadata or bill_number
  const getBillId = () => {
    // Try to extract bill ID from metadata first
    if (item.metadata?.bill_id) {
      return item.metadata.bill_id;
    }
    
    // For now, assume bill_number corresponds to our test bills
    const billNumber = item.bill_number || item.metadata?.bill_number?.replace(/"/g, '');
    if (billNumber) {
      // Map known bill numbers to their IDs for testing
      const billMapping: { [key: string]: number } = {
        'AB1': 1889861,
        'AB2': 1889867, 
        'AB3': 1889869
      };
      
      if (billMapping[billNumber]) {
        return billMapping[billNumber];
      }
      
      // Fallback: try to parse number (e.g., "AB1" -> 1, "SB123" -> 123)
      const match = billNumber.match(/(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }
    
    return null;
  };

  // Fetch polls related to this bill
  const fetchPolls = async () => {
    const billId = getBillId();
    if (!billId) return;

    try {
      setPollsLoading(true);
      setPollsError(null);

      const response = await fetch(`/api/legislative-polls?bill_id=${billId}&active_only=true&limit=5`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch polls');
      }

      const data = await response.json();
      if (data.success) {
        setPolls(data.data.polls || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      setPollsError('Failed to load polls');
    } finally {
      setPollsLoading(false);
    }
  };

  // Fetch polls when expanded
  useEffect(() => {
    if (isExpanded && polls.length === 0 && !pollsLoading) {
      fetchPolls();
    }
  }, [isExpanded]);

  const getIcon = () => {
    switch (item.type) {
      case 'bill_introduced':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'bill_updated':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </div>
        );
      case 'vote_result':
        const passed = item.metadata?.passed;
        return (
          <div className={`flex-shrink-0 w-8 h-8 ${passed ? 'bg-green-100' : 'bg-red-100'} rounded-full flex items-center justify-center`}>
            <svg className={`w-4 h-4 ${passed ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
        );
      case 'vote_scheduled':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'status_change':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        );
      case 'bill_signed':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'bill_in_committee':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        );
      case 'bill_passed_chamber':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
        );
      case 'hearing_scheduled':
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
    }
  };

  const getTypeLabel = () => {
    switch (item.type) {
      case 'bill_introduced': return 'New Bill';
      case 'bill_updated': return 'Bill Update';
      case 'vote_result': return 'Vote Result';
      case 'vote_scheduled': return 'Upcoming Vote';
      case 'status_change': return 'Status Change';
      case 'bill_signed': return 'Signed Into Law';
      case 'bill_in_committee': return 'In Committee';
      case 'bill_passed_chamber': return 'Passed Chamber';
      case 'hearing_scheduled': return 'Hearing Scheduled';
      default: return 'Update';
    }
  };

  const getTypeColor = () => {
    switch (item.type) {
      case 'bill_introduced': return 'bg-blue-100 text-blue-800';
      case 'bill_updated': return 'bg-yellow-100 text-yellow-800';
      case 'vote_result': 
        const passed = item.metadata?.passed;
        return passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      case 'vote_scheduled': return 'bg-purple-100 text-purple-800';
      case 'status_change': return 'bg-indigo-100 text-indigo-800';
      case 'bill_signed': return 'bg-emerald-100 text-emerald-800';
      case 'bill_in_committee': return 'bg-orange-100 text-orange-800';
      case 'bill_passed_chamber': return 'bg-teal-100 text-teal-800';
      case 'hearing_scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatActionDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 0) {
      return 'Today';
    } else if (daysDiff === 1) {
      return 'Yesterday';
    } else if (daysDiff < 7) {
      return `${daysDiff} days ago`;
    } else {
      return format(date, 'MMM d, yyyy');
    }
  };

  const renderMetadata = () => {
    const { metadata } = item;
    if (!metadata || Object.keys(metadata).length === 0) return null;

    return (
      <div className="mt-3 text-sm text-gray-600">
        {item.type === 'vote_result' && metadata.vote_breakdown && (
          <div className="flex items-center space-x-4">
            <span className="text-green-600 font-medium">✓ {metadata.vote_breakdown.yea} Yes</span>
            <span className="text-red-600 font-medium">✗ {metadata.vote_breakdown.nay} No</span>
            {metadata.vote_breakdown.not_voting > 0 && (
              <span className="text-gray-500">{metadata.vote_breakdown.not_voting} NV</span>
            )}
            {metadata.vote_breakdown.absent > 0 && (
              <span className="text-gray-500">{metadata.vote_breakdown.absent} Absent</span>
            )}
          </div>
        )}
        
        {metadata.chamber && (
          <div className="mt-1">
            <span className="font-medium">Chamber:</span> {metadata.chamber}
          </div>
        )}
        
        {metadata.sponsors && metadata.sponsors.length > 0 && (
          <div className="mt-1">
            <span className="font-medium">Sponsors:</span> {metadata.sponsors.slice(0, 3).join(', ')}
            {metadata.sponsors.length > 3 && ` and ${metadata.sponsors.length - 3} more`}
          </div>
        )}
        
        {metadata.committee && (
          <div className="mt-1">
            <span className="font-medium">Committee:</span> {metadata.committee}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {getIcon()}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor()}`}>
              {getTypeLabel()}
            </span>
            <span className="text-sm text-gray-500">
              {formatActionDate(item.action_date)}
            </span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-tight">
            {item.title}
          </h3>
          
          {item.description && (
            <p className="text-gray-600 mb-3 leading-relaxed">
              {item.description}
            </p>
          )}
          
          {renderMetadata()}
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex flex-wrap gap-2">
              {item.subjects.slice(0, 3).map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {subject}
                </span>
              ))}
              {item.subjects.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                  +{item.subjects.length - 3} more
                </span>
              )}
            </div>

            {item.districts.length > 0 && (
              <div className="flex items-center text-xs text-gray-500">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {item.districts.slice(0, 2).join(', ')}
                {item.districts.length > 2 && ` +${item.districts.length - 2}`}
              </div>
            )}
          </div>

          {/* Expand/Collapse Button */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <span>{isExpanded ? 'Show Less' : 'Show More Details'}</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
              {/* Bill Information */}
              {(item.bill_number || item.bill_title || item.metadata?.bill_number || item.metadata?.bill_title) && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Bill Information</h4>
                  {(item.bill_number || item.metadata?.bill_number) && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Bill Number:</span>
                      <span className="ml-2 text-gray-900">{item.bill_number || item.metadata?.bill_number?.replace(/"/g, '')}</span>
                    </div>
                  )}
                  {(item.bill_title || item.metadata?.bill_title) && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Full Title:</span>
                      <p className="mt-1 text-gray-900">{item.bill_title || item.metadata?.bill_title?.replace(/"/g, '')}</p>
                    </div>
                  )}
                  
                  {/* Districts Affected */}
                  {item.districts.length > 0 && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-700">Districts Affected:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.districts.map((district) => (
                          <span
                            key={district}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            District {district}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Subjects */}
                  {item.subjects.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">All Topics:</span>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* External Links */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">View Official Documents</h4>
                <div className="space-y-2">
                  {/* LegiScan Link */}
                  {(item.bill_number || item.metadata?.bill_number) && (
                    <a
                      href={`https://legiscan.com/NV/bill/${item.bill_number || item.metadata?.bill_number?.replace(/"/g, '')}/2025`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">LegiScan Bill Details</div>
                          <div className="text-sm text-gray-600">Full bill text, history, and votes</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {/* Nevada Legislature Bill Overview */}
                  {item.metadata?.state_overview_link && (
                    <a
                      href={item.metadata.state_overview_link.replace(/"/g, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Nevada Legislature Overview</div>
                          <div className="text-sm text-gray-600">Official bill tracking and status</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}

                  {/* Nevada Legislature Bill Text PDF */}
                  {item.metadata?.state_text_link && (
                    <a
                      href={item.metadata.state_text_link.replace(/"/g, '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Bill Text (PDF)</div>
                          <div className="text-sm text-gray-600">Download official bill document</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </a>
                  )}

                  {/* Fallback: Nevada Legislature Search */}
                  {!item.metadata?.state_overview_link && (item.bill_number || item.metadata?.bill_number) && (
                    <a
                      href="https://www.leg.state.nv.us/App/NELIS/REL/83rd2025/Bills"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-blue-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <div>
                          <div className="font-medium text-gray-900">Search Nevada Bills</div>
                          <div className="text-sm text-gray-600">Browse all 2025 legislation</div>
                        </div>
                      </div>
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="mt-3 text-xs text-gray-600">
                  📝 Links open in new tabs to official government websites
                </div>
              </div>

              {/* Legislative Polls Section */}
              <div className="space-y-4">
                {pollsLoading && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mr-3"></div>
                      <span className="text-purple-700 font-medium">Loading polls...</span>
                    </div>
                  </div>
                )}

                {pollsError && (
                  <div className="bg-red-50 rounded-lg p-4">
                    <div className="text-red-700 font-medium mb-2">Failed to load polls</div>
                    <div className="text-red-600 text-sm mb-3">{pollsError}</div>
                    <button
                      onClick={fetchPolls}
                      className="text-red-600 text-sm underline hover:no-underline"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {polls.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Legislative Polls ({polls.length})
                      </h4>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                        Active
                      </span>
                    </div>
                    
                    {polls.map((poll) => (
                      <LegislativePoll
                        key={poll.id}
                        poll={poll}
                        showDetails={false}
                        className="border-l-4 border-purple-200"
                      />
                    ))}
                  </div>
                )}

                {!pollsLoading && !pollsError && polls.length === 0 && isExpanded && getBillId() && (
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-gray-500 mb-2">No active polls for this bill</div>
                    <div className="text-gray-400 text-sm">
                      Polls may be created by representatives to gauge public opinion
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}