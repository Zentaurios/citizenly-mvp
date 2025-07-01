'use client';

import { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';

interface FeedFiltersProps {
  currentFilters: {
    type: string[];
    subjects: string[];
  };
  onFiltersChange: (filters: any) => void;
}

const FEED_TYPES = [
  { value: 'bill_introduced', label: 'New Bills', description: 'Newly introduced legislation' },
  { value: 'bill_updated', label: 'Bill Updates', description: 'Changes to existing bills' },
  { value: 'vote_result', label: 'Vote Results', description: 'Completed legislative votes' },
  { value: 'vote_scheduled', label: 'Upcoming Votes', description: 'Scheduled voting sessions' },
  { value: 'status_change', label: 'Status Changes', description: 'Bill progress updates' },
];

const SUBJECTS = [
  'Agriculture',
  'Budget',
  'Business',
  'Criminal Justice',
  'Economy',
  'Education',
  'Energy',
  'Environment',
  'Gaming',
  'Government',
  'Healthcare',
  'Housing',
  'Immigration',
  'Labor',
  'Public Safety',
  'Recreation',
  'Social Services',
  'Taxation',
  'Technology',
  'Transportation',
  'Veterans',
  'Water'
];

export function FeedFilters({ currentFilters, onFiltersChange }: FeedFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    types: false,
    subjects: false
  });

  const toggleFilter = (category: 'type' | 'subjects', value: string) => {
    const current = currentFilters[category];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    
    onFiltersChange({
      ...currentFilters,
      [category]: updated
    });
  };

  const clearFilters = () => {
    onFiltersChange({ type: [], subjects: [] });
    setShowFilters(false);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const hasActiveFilters = currentFilters.type.length > 0 || currentFilters.subjects.length > 0;
  const activeFilterCount = currentFilters.type.length + currentFilters.subjects.length;

  return (
    <div className="relative">
      <div className="flex items-center space-x-3">
        <Button
          variant={hasActiveFilters ? "default" : "outline"}
          onClick={() => setShowFilters(!showFilters)}
          className="relative"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
          </svg>
          Filter Feed
          {hasActiveFilters && (
            <span className="ml-2 bg-white text-blue-600 rounded-full text-xs px-2 py-1 font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} className="text-sm">
            Clear All
          </Button>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {currentFilters.type.map((type) => {
            const typeInfo = FEED_TYPES.find(t => t.value === type);
            return (
              <span
                key={type}
                className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm bg-blue-100 text-blue-800"
              >
                {typeInfo?.label || type}
                <button
                  onClick={() => toggleFilter('type', type)}
                  className="ml-1.5 hover:text-blue-600"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            );
          })}
          {currentFilters.subjects.map((subject) => (
            <span
              key={subject}
              className="inline-flex items-center px-2.5 py-1.5 rounded-md text-sm bg-green-100 text-green-800"
            >
              {subject}
              <button
                onClick={() => toggleFilter('subjects', subject)}
                className="ml-1.5 hover:text-green-600"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Filter panel */}
      {showFilters && (
        <Card className="absolute z-10 mt-2 w-96 max-w-[calc(100vw-2rem)] bg-white shadow-lg border">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Filter Options</h3>
              <button
                onClick={() => setShowFilters(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Update Types */}
              <div>
                <button
                  onClick={() => toggleSection('types')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-medium text-gray-700">Update Types</h4>
                  <svg 
                    className={`w-4 h-4 transition-transform ${expandedSections.types ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedSections.types && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {FEED_TYPES.map((type) => (
                      <label key={type.value} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={currentFilters.type.includes(type.value)}
                          onChange={() => toggleFilter('type', type.value)}
                          className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900">{type.label}</div>
                          <div className="text-xs text-gray-500">{type.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Subjects */}
              <div>
                <button
                  onClick={() => toggleSection('subjects')}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h4 className="text-sm font-medium text-gray-700">Legislative Subjects</h4>
                  <svg 
                    className={`w-4 h-4 transition-transform ${expandedSections.subjects ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expandedSections.subjects && (
                  <div className="mt-3 max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-2 gap-2">
                      {SUBJECTS.map((subject) => (
                        <label key={subject} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                          <input
                            type="checkbox"
                            checked={currentFilters.subjects.includes(subject)}
                            onChange={() => toggleFilter('subjects', subject)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500 text-sm"
                          />
                          <span className="text-sm text-gray-600">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between">
              <Button variant="ghost" onClick={clearFilters} className="text-sm">
                Clear All Filters
              </Button>
              <Button onClick={() => setShowFilters(false)} className="text-sm">
                Apply Filters
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}