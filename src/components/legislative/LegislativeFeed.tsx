'use client';

import { useState, useEffect } from 'react';
import { FeedItem } from './FeedItem';
import { FeedFilters } from './FeedFilters';
import { Card } from '../ui/card';

interface FeedItemType {
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
}

interface LegislativeFeedProps {
  userId: string;
  className?: string;
}

export function LegislativeFeed({ userId, className = '' }: LegislativeFeedProps) {
  const [feedItems, setFeedItems] = useState<FeedItemType[]>([]);
  const [filters, setFilters] = useState({
    type: [] as string[],
    subjects: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = async (pageNum: number = 1, resetItems: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/legislative/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          filters,
          page: pageNum,
          limit: 20
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to load feed: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (resetItems) {
        setFeedItems(data.items);
      } else {
        setFeedItems(prev => [...prev, ...data.items]);
      }
      
      setHasMore(data.hasMore);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load legislative feed:', error);
      setError(error instanceof Error ? error.message : 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed(1, true);
  }, [userId, filters]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadFeed(page + 1, false);
    }
  };

  const handleFiltersChange = (newFilters: typeof filters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleRefresh = () => {
    loadFeed(1, true);
  };

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold">Failed to Load Legislative Feed</h3>
            <p className="text-sm text-gray-600 mt-1">{error}</p>
          </div>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto ${className}`}>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Legislative Feed</h1>
          <button
            onClick={handleRefresh}
            className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            disabled={loading}
          >
            <svg 
              className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
        
        <p className="text-gray-600 mb-4">
          Stay updated on Nevada legislative activity that affects your district and interests.
        </p>
        
        <FeedFilters 
          currentFilters={filters}
          onFiltersChange={handleFiltersChange}
        />
      </div>

      {loading && feedItems.length === 0 ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-5 h-5 bg-gray-200 rounded"></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="flex space-x-2">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {feedItems.map((item) => (
              <FeedItem key={item.id} item={item} />
            ))}
          </div>
          
          {feedItems.length === 0 && !loading && (
            <Card className="p-12 text-center">
              <div className="text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium mb-2">No Legislative Updates</h3>
                <p className="text-sm">
                  No legislative updates found for your current filters. 
                  Try adjusting your filters or check back later for new activity.
                </p>
              </div>
            </Card>
          )}

          {hasMore && !loading && feedItems.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Load More Updates
              </button>
            </div>
          )}

          {loading && feedItems.length > 0 && (
            <div className="mt-8 text-center">
              <div className="inline-flex items-center px-4 py-2 text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Loading more updates...
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}