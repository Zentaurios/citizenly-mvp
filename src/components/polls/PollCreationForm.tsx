'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Calendar, Users, Settings, Eye, Save, Send } from 'lucide-react';

// Types for our form data
interface PollFormData {
  title: string;
  description: string;
  poll_type: 'yes_no' | 'multiple_choice' | 'approval_rating' | 'ranked_choice';
  options: {
    options?: string[];
    scale?: {
      min: number;
      max: number;
      labels?: Record<number, string>;
    };
  };
  starts_at: string;
  ends_at: string;
  max_responses?: number;
  requires_verification: boolean;
  allows_anonymous: boolean;
  show_results_before_vote: boolean;
  show_results_after_vote: boolean;
}

interface PollCreationFormProps {
  onSuccess?: (pollId: string) => void;
  initialData?: Partial<PollFormData>;
}

export default function PollCreationForm({ onSuccess, initialData }: PollCreationFormProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'details' | 'options' | 'audience' | 'settings' | 'preview'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<PollFormData>({
    title: '',
    description: '',
    poll_type: 'yes_no',
    options: {},
    starts_at: new Date().toISOString().slice(0, 16),
    ends_at: '',
    requires_verification: true,
    allows_anonymous: false,
    show_results_before_vote: false,
    show_results_after_vote: true,
    ...initialData
  });

  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>(['', '']);
  const [approvalLabels, setApprovalLabels] = useState<Record<number, string>>({
    1: 'Strongly Disapprove',
    2: 'Disapprove', 
    3: 'Neutral',
    4: 'Approve',
    5: 'Strongly Approve'
  });

  useEffect(() => {
    if (formData.poll_type === 'multiple_choice') {
      setFormData(prev => ({
        ...prev,
        options: { ...prev.options, options: multipleChoiceOptions.filter(opt => opt.trim()) }
      }));
    } else if (formData.poll_type === 'approval_rating') {
      setFormData(prev => ({
        ...prev,
        options: { 
          ...prev.options, 
          scale: { 
            min: 1, 
            max: 5, 
            labels: approvalLabels 
          } 
        }
      }));
    }
  }, [formData.poll_type, multipleChoiceOptions, approvalLabels]);

  const updateFormData = (updates: Partial<PollFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(updates).forEach(key => delete newErrors[key]);
      return newErrors;
    });
  };

  const addMultipleChoiceOption = () => {
    setMultipleChoiceOptions(prev => [...prev, '']);
  };

  const removeMultipleChoiceOption = (index: number) => {
    setMultipleChoiceOptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateMultipleChoiceOption = (index: number, value: string) => {
    setMultipleChoiceOptions(prev => prev.map((opt, i) => i === index ? value : opt));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Poll title is required';
    }

    if (formData.poll_type === 'multiple_choice') {
      const validOptions = multipleChoiceOptions.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        newErrors.options = 'Multiple choice polls need at least 2 options';
      }
    }

    if (formData.ends_at && new Date(formData.ends_at) <= new Date(formData.starts_at)) {
      newErrors.ends_at = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!validateForm()) {
      setActiveTab('details');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'draft' : 'active',
          is_active: !isDraft
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create poll');
      }

      const result = await response.json();
      
      if (onSuccess) {
        onSuccess(result.poll.id);
      } else {
        router.push(`/dashboard/polls/${result.poll.id}`);
      }
    } catch (error) {
      console.error('Error creating poll:', error);
      setErrors({ submit: 'Failed to create poll. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details', icon: Settings },
    { id: 'options', label: 'Options', icon: Users },
    { id: 'audience', label: 'Audience', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'preview', label: 'Preview', icon: Eye }
  ];

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-purple-600 text-white p-6">
        <h1 className="text-2xl font-bold">Create New Poll</h1>
        <p className="text-purple-100 mt-1">Engage with your constituents on important issues</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Form Content */}
      <div className="p-6">
        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="What would you like to ask your constituents?"
                className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                maxLength={255}
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
              <p className="text-gray-500 text-sm mt-1">{formData.title.length}/255 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Provide additional context or details about this poll..."
                rows={4}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                maxLength={2000}
              />
              <p className="text-gray-500 text-sm mt-1">{formData.description.length}/2000 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Poll Type *
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: 'yes_no', label: 'Yes/No Question', desc: 'Simple yes or no response' },
                  { value: 'multiple_choice', label: 'Multiple Choice', desc: 'Choose from several options' },
                  { value: 'approval_rating', label: 'Approval Rating', desc: '1-5 scale rating' },
                  { value: 'ranked_choice', label: 'Ranked Choice', desc: 'Rank options by preference' }
                ].map((type) => (
                  <div
                    key={type.value}
                    onClick={() => updateFormData({ poll_type: type.value as any })}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      formData.poll_type === type.value
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-500 mt-1">{type.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Options Tab */}
        {activeTab === 'options' && (
          <div className="space-y-6">
            {formData.poll_type === 'yes_no' && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Yes/No polls don't require additional options.</p>
                  <p className="text-sm mt-2">Voters will simply choose "Yes", "No", or "Undecided".</p>
                </div>
              </div>
            )}

            {formData.poll_type === 'multiple_choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Poll Options *
                </label>
                <div className="space-y-3">
                  {multipleChoiceOptions.map((option, index) => (
                    <div key={index} className="flex space-x-3">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => updateMultipleChoiceOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                      {multipleChoiceOptions.length > 2 && (
                        <button
                          onClick={() => removeMultipleChoiceOption(index)}
                          className="p-3 text-red-500 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {errors.options && <p className="text-red-500 text-sm mt-2">{errors.options}</p>}
                <button
                  onClick={addMultipleChoiceOption}
                  className="mt-3 flex items-center space-x-2 text-purple-600 hover:text-purple-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Option</span>
                </button>
              </div>
            )}

            {formData.poll_type === 'approval_rating' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Rating Scale Labels
                </label>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-3">
                      <span className="w-8 text-center font-medium">{rating}</span>
                      <input
                        type="text"
                        value={approvalLabels[rating]}
                        onChange={(e) => setApprovalLabels(prev => ({ ...prev, [rating]: e.target.value }))}
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.poll_type === 'ranked_choice' && (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p>Ranked choice voting is coming soon!</p>
                  <p className="text-sm mt-2">This feature will be available in a future update.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Audience Tab */}
        {activeTab === 'audience' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Users className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900">Automatic Audience Targeting</h3>
                  <p className="text-blue-700 text-sm mt-1">
                    This poll will automatically be sent to all verified constituents in your congressional district.
                    Only verified voters from your district can participate.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Responses
              </label>
              <input
                type="number"
                value={formData.max_responses || ''}
                onChange={(e) => updateFormData({ max_responses: e.target.value ? parseInt(e.target.value) : undefined })}
                placeholder="Leave empty for unlimited"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="1"
              />
              <p className="text-gray-500 text-sm mt-1">
                Limit the number of responses if needed. Leave empty for unlimited responses.
              </p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={formData.starts_at}
                  onChange={(e) => updateFormData({ starts_at: e.target.value })}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date & Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.ends_at}
                  onChange={(e) => updateFormData({ ends_at: e.target.value })}
                  className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.ends_at ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.ends_at && <p className="text-red-500 text-sm mt-1">{errors.ends_at}</p>}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Poll Settings</h3>
              
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.requires_verification}
                    onChange={(e) => updateFormData({ requires_verification: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Require Verification</div>
                    <div className="text-sm text-gray-500">Only verified voters can participate</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.show_results_before_vote}
                    onChange={(e) => updateFormData({ show_results_before_vote: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Show Results Before Voting</div>
                    <div className="text-sm text-gray-500">Display current results to voters before they vote</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={formData.show_results_after_vote}
                    onChange={(e) => updateFormData({ show_results_after_vote: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">Show Results After Voting</div>
                    <div className="text-sm text-gray-500">Display results after the voter submits their response</div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">{formData.title || 'Poll Title'}</h2>
              {formData.description && (
                <p className="text-gray-600 mb-4">{formData.description}</p>
              )}

              <div className="bg-white rounded-lg p-4 border">
                {formData.poll_type === 'yes_no' && (
                  <div className="space-y-3">
                    {['Yes', 'No', 'Undecided'].map((option) => (
                      <label key={option} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="preview" className="w-4 h-4 text-purple-600" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {formData.poll_type === 'multiple_choice' && (
                  <div className="space-y-3">
                    {multipleChoiceOptions.filter(opt => opt.trim()).map((option, index) => (
                      <label key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="preview" className="w-4 h-4 text-purple-600" />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {formData.poll_type === 'approval_rating' && (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <label key={rating} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input type="radio" name="preview" className="w-4 h-4 text-purple-600" />
                        <span className="flex items-center space-x-2">
                          <span className="font-medium">{rating}</span>
                          <span>-</span>
                          <span>{approvalLabels[rating]}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                <button className="w-full mt-4 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors">
                  Submit Vote
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
        <div>
          {errors.submit && (
            <p className="text-red-500 text-sm">{errors.submit}</p>
          )}
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>Save Draft</span>
          </button>
          
          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Poll'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
