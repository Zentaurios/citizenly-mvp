'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  Clock, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Download,
  Filter,
  Search,
  Calendar,
  AlertCircle,
  CheckCircle,
  PlayCircle,
  PauseCircle
} from 'lucide-react';
import { AuthUser } from '@/lib/database/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Types for dashboard data
interface Poll {
  id: string;
  title: string;
  description?: string;
  poll_type: string;
  status: 'draft' | 'active' | 'closed' | 'archived';
  is_active: boolean;
  total_responses: number;
  response_rate?: number;
  engagement_score?: number;
  starts_at: string;
  ends_at?: string;
  created_at: string;
}

interface DashboardStats {
  total_polls: number;
  active_polls: number;
  total_responses: number;
  avg_response_rate: number;
  avg_engagement_score: number;
  trending_topics: string[];
}

interface PollAnalytics {
  poll_id: string;
  demographic_breakdown: {
    age_groups?: Record<string, number>;
    districts?: Record<string, number>;
    party_affiliations?: Record<string, number>;
  };
  response_distribution: any;
  engagement_metrics: {
    participation_rate: number;
    completion_rate: number;
    avg_response_time: number;
    peak_response_times: Array<{ hour: number; responses: number }>;
  };
}

interface EnhancedPoliticianDashboardProps {
  user: AuthUser;
}

export default function EnhancedPoliticianDashboard({ user }: EnhancedPoliticianDashboardProps) {
  const router = useRouter();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedPoll, setSelectedPoll] = useState<Poll | null>(null);
  const [analytics, setAnalytics] = useState<PollAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, [statusFilter, sortBy, sortOrder]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams({
        sort_by: sortBy,
        sort_order: sortOrder,
        include_draft: 'true',
        include_closed: 'true'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/polls?${params}`);
      if (!response.ok) throw new Error('Failed to load polls');
      
      const result = await response.json();
      setPolls(result.data.polls);

      // Load dashboard statistics
      await loadDashboardStats();
      
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardStats = async () => {
    try {
      // Calculate stats from polls data
      const totalPolls = polls.length;
      const activePolls = polls.filter(p => p.is_active && p.status === 'active').length;
      const totalResponses = polls.reduce((sum, poll) => sum + poll.total_responses, 0);
      const avgResponseRate = polls.length > 0 
        ? polls.reduce((sum, poll) => sum + (poll.response_rate || 0), 0) / polls.length 
        : 0;
      const avgEngagementScore = polls.length > 0
        ? polls.reduce((sum, poll) => sum + (poll.engagement_score || 0), 0) / polls.length
        : 0;

      setStats({
        total_polls: totalPolls,
        active_polls: activePolls,
        total_responses: totalResponses,
        avg_response_rate: avgResponseRate,
        avg_engagement_score: avgEngagementScore,
        trending_topics: [] // Would be calculated from poll content analysis
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadPollAnalytics = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/analytics`);
      if (!response.ok) throw new Error('Failed to load analytics');
      
      const result = await response.json();
      setAnalytics(result.data);
      
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const handlePollAction = async (pollId: string, action: 'activate' | 'pause' | 'close' | 'delete') => {
    try {
      let response;
      
      switch (action) {
        case 'activate':
          response = await fetch(`/api/polls/${pollId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: true, status: 'active' })
          });
          break;
        case 'pause':
          response = await fetch(`/api/polls/${pollId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_active: false })
          });
          break;
        case 'close':
          response = await fetch(`/api/polls/${pollId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'closed', is_active: false })
          });
          break;
        case 'delete':
          response = await fetch(`/api/polls/${pollId}`, {
            method: 'DELETE'
          });
          break;
      }

      if (!response?.ok) {
        const errorData = await response?.json();
        throw new Error(errorData?.error || 'Action failed');
      }

      // Reload polls
      await loadDashboardData();

    } catch (error) {
      console.error(`Error ${action} poll:`, error);
      alert(`Failed to ${action} poll: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exportPollData = async (pollId: string) => {
    try {
      const response = await fetch(`/api/polls/${pollId}/export`);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `poll-${pollId}-data.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Error exporting poll data:', error);
      alert('Failed to export poll data');
    }
  };

  const getStatusIcon = (poll: Poll) => {
    if (poll.status === 'draft') return <Edit className="w-4 h-4 text-gray-500" />;
    if (poll.is_active && poll.status === 'active') return <PlayCircle className="w-4 h-4 text-green-500" />;
    if (!poll.is_active && poll.status === 'active') return <PauseCircle className="w-4 h-4 text-yellow-500" />;
    if (poll.status === 'closed') return <CheckCircle className="w-4 h-4 text-blue-500" />;
    return <AlertCircle className="w-4 h-4 text-gray-500" />;
  };

  const getStatusText = (poll: Poll) => {
    if (poll.status === 'draft') return 'Draft';
    if (poll.is_active && poll.status === 'active') return 'Active';
    if (!poll.is_active && poll.status === 'active') return 'Paused';
    if (poll.status === 'closed') return 'Closed';
    return 'Unknown';
  };

  const filteredPolls = polls.filter(poll => {
    if (searchTerm && !poll.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Poll Dashboard</h1>
              <p className="text-gray-600">Manage your polls and view analytics</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/polls/create')}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Create Poll</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_polls}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <PlayCircle className="w-8 h-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Polls</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_polls}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Users className="w-8 h-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total_responses.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Avg Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avg_response_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center">
                <BarChart3 className="w-8 h-8 text-indigo-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.avg_engagement_score.toFixed(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters and Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="closed">Closed</option>
              <option value="archived">Archived</option>
            </select>
            
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="created_at-desc">Newest First</option>
              <option value="created_at-asc">Oldest First</option>
              <option value="total_responses-desc">Most Responses</option>
              <option value="response_rate-desc">Highest Response Rate</option>
              <option value="title-asc">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Development Testing Section */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-900">Development Testing</h3>
                <p className="text-sm text-yellow-700">Test notification system functionality</p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/notifications/test', {
                      method: 'POST'
                    });
                    if (response.ok) {
                      alert('Test notification sent!');
                    } else {
                      alert('Failed to send test notification');
                    }
                  } catch (error) {
                    alert('Error sending test notification');
                  }
                }}
                className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
              >
                Send Test Notification
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Polls List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Your Polls</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {filteredPolls.length === 0 ? (
                  <div className="p-6 text-center">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
                    <p className="text-gray-600 mb-4">
                      {searchTerm || statusFilter !== 'all' 
                        ? 'Try adjusting your filters or search terms'
                        : 'Create your first poll to start engaging with constituents'
                      }
                    </p>
                    <button
                      onClick={() => router.push('/dashboard/polls/create')}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Create Your First Poll
                    </button>
                  </div>
                ) : (
                  filteredPolls.map((poll) => (
                    <div
                      key={poll.id}
                      className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedPoll?.id === poll.id ? 'bg-purple-50 border-r-4 border-purple-500' : ''
                      }`}
                      onClick={() => {
                        setSelectedPoll(poll);
                        loadPollAnalytics(poll.id);
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getStatusIcon(poll)}
                            <span className="text-sm font-medium text-gray-600">
                              {getStatusText(poll)}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-400">
                              {poll.poll_type.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          
                          <h3 className="font-semibold text-gray-900 mb-2">{poll.title}</h3>
                          
                          {poll.description && (
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {poll.description}
                            </p>
                          )}
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4" />
                              <span>{poll.total_responses} responses</span>
                            </div>
                            
                            {poll.response_rate && (
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-4 h-4" />
                                <span>{poll.response_rate.toFixed(1)}% rate</span>
                              </div>
                            )}
                            
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(poll.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {poll.status === 'draft' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollAction(poll.id, 'activate');
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Activate Poll"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {poll.is_active && poll.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollAction(poll.id, 'pause');
                              }}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                              title="Pause Poll"
                            >
                              <PauseCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {!poll.is_active && poll.status === 'active' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePollAction(poll.id, 'activate');
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded"
                              title="Resume Poll"
                            >
                              <PlayCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/polls/${poll.id}`);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Poll"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportPollData(poll.id);
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                            title="Export Data"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          
                          {poll.total_responses === 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm('Are you sure you want to delete this poll?')) {
                                  handlePollAction(poll.id, 'delete');
                                }
                              }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Poll"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Analytics Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Analytics</h2>
              </div>
              
              {selectedPoll ? (
                <div className="p-6">
                  <h3 className="font-medium text-gray-900 mb-4">{selectedPoll.title}</h3>
                  
                  {analytics ? (
                    <div className="space-y-6">
                      {/* Engagement Metrics */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Engagement</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Participation Rate</span>
                            <span className="text-sm font-medium">
                              {analytics.engagement_metrics.participation_rate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Completion Rate</span>
                            <span className="text-sm font-medium">
                              {analytics.engagement_metrics.completion_rate.toFixed(1)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Avg Response Time</span>
                            <span className="text-sm font-medium">
                              {Math.round(analytics.engagement_metrics.avg_response_time)}s
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Demographics */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Demographics</h4>
                        {analytics.demographic_breakdown.age_groups && (
                          <div className="space-y-2">
                            {Object.entries(analytics.demographic_breakdown.age_groups).map(([group, count]) => (
                              <div key={group} className="flex justify-between">
                                <span className="text-sm text-gray-600">{group}</span>
                                <span className="text-sm font-medium">{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => router.push(`/dashboard/polls/${selectedPoll.id}/analytics`)}
                        className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        View Detailed Analytics
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Loading analytics...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a poll to view analytics</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}