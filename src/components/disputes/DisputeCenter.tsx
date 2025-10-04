'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { toast } from '@/lib/toast';

interface Dispute {
  id: string;
  category: string;
  subject: string;
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'AWAITING_RESPONSE' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  evidence: string[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  rental: {
    id: string;
    startDate: string;
    endDate: string;
    gear: {
      id: string;
      title: string;
      images: string[];
    };
  };
  reporter: {
    id: string;
    full_name: string;
    email: string;
  };
  respondent: {
    id: string;
    full_name: string;
    email: string;
  };
  responses: Array<{
    id: string;
    message: string;
    isAdmin: boolean;
    evidence: string[];
    createdAt: string;
    user: {
      id: string;
      full_name: string;
    };
  }>;
}

const statusConfig = {
  OPEN: {
    label: 'Open',
    color: 'bg-red-100 text-red-800',
    icon: '🔴'
  },
  IN_REVIEW: {
    label: 'In Review',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '👀'
  },
  AWAITING_RESPONSE: {
    label: 'Awaiting Response',
    color: 'bg-blue-100 text-blue-800',
    icon: '⏳'
  },
  RESOLVED: {
    label: 'Resolved',
    color: 'bg-green-100 text-green-800',
    icon: '✅'
  },
  CLOSED: {
    label: 'Closed',
    color: 'bg-gray-100 text-gray-800',
    icon: '🔒'
  },
  ESCALATED: {
    label: 'Escalated',
    color: 'bg-purple-100 text-purple-800',
    icon: '🚀'
  }
};

const priorityConfig = {
  LOW: { label: 'Low', color: 'text-gray-600' },
  MEDIUM: { label: 'Medium', color: 'text-blue-600' },
  HIGH: { label: 'High', color: 'text-orange-600' },
  URGENT: { label: 'Urgent', color: 'text-red-600' }
};

const categoryConfig = {
  DAMAGE: { label: 'Damage', icon: '🔧' },
  MISSING_ITEM: { label: 'Missing Item', icon: '❓' },
  PAYMENT_ISSUE: { label: 'Payment Issue', icon: '💳' },
  COMMUNICATION: { label: 'Communication', icon: '💬' },
  POLICY_VIOLATION: { label: 'Policy Violation', icon: '⚠️' },
  SAFETY_CONCERN: { label: 'Safety Concern', icon: '🛡️' },
  OTHER: { label: 'Other', icon: '📋' }
};

interface CreateDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rentalId?: string;
  onSuccess: () => void;
}

const CreateDisputeModal = ({ isOpen, onClose, rentalId, onSuccess }: CreateDisputeModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rentalId: rentalId || '',
    category: 'DAMAGE',
    subject: '',
    description: '',
    evidence: [] as string[]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create dispute');
      }

      toast.success('Dispute created successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Create dispute error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create dispute');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Dispute</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rental ID
              </label>
              <input
                type="text"
                required
                value={formData.rentalId}
                onChange={(e) => setFormData({ ...formData, rentalId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter rental ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief summary of the issue"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Detailed description of what happened..."
                maxLength={2000}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.description.length}/2000 characters
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <LoadingSpinner size="sm" /> : 'Create Dispute'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default function DisputeCenter() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/disputes');
      if (!response.ok) {
        throw new Error('Failed to fetch disputes');
      }
      const data = await response.json();
      setDisputes(data.data || []);
    } catch (error) {
      console.error('Dispute fetch error:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'all') return true;
    if (filter === 'open') return !['RESOLVED', 'CLOSED'].includes(dispute.status);
    if (filter === 'resolved') return ['RESOLVED', 'CLOSED'].includes(dispute.status);
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" text="Loading disputes..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dispute Center</h1>
          <p className="text-gray-600">Manage and resolve rental disputes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium"
        >
          Report Issue
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
        {([
          { key: 'all' as const, label: 'All Disputes', count: disputes.length },
          { key: 'open' as const, label: 'Open', count: disputes.filter(d => !['RESOLVED', 'CLOSED'].includes(d.status)).length },
          { key: 'resolved' as const, label: 'Resolved', count: disputes.filter(d => ['RESOLVED', 'CLOSED'].includes(d.status)).length }
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              'flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors',
              filter === tab.key
                ? 'bg-white text-gray-900 shadow'
                : 'text-gray-600 hover:text-gray-900'
            )}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Dispute List */}
      {filteredDisputes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No disputes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all' 
              ? "You haven't reported any disputes yet."
              : `No ${filter} disputes at the moment.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredDisputes.map((dispute) => {
            const statusInfo = statusConfig[dispute.status];
            const categoryInfo = categoryConfig[dispute.category as keyof typeof categoryConfig];
            const priorityInfo = priorityConfig[dispute.priority];

            return (
              <div key={dispute.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{categoryInfo.icon}</span>
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {dispute.subject}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {dispute.description}
                      </p>
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-4">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusInfo.color)}>
                        <span className="mr-1">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </span>
                      <span className={cn('text-xs font-medium', priorityInfo.color)}>
                        {priorityInfo.label} Priority
                      </span>
                    </div>
                  </div>

                  {/* Rental Info */}
                  <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-12 h-12 relative flex-shrink-0">
                      <Image
                        src={dispute.rental.gear.images[0] || '/placeholder-gear.jpg'}
                        alt={dispute.rental.gear.title}
                        fill
                        className="object-cover rounded"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {dispute.rental.gear.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(dispute.rental.startDate)} - {formatDate(dispute.rental.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-gray-600">Reporter:</p>
                      <p className="font-medium text-gray-900">{dispute.reporter.full_name}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Respondent:</p>
                      <p className="font-medium text-gray-900">{dispute.respondent.full_name}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Created {formatDate(dispute.createdAt)}
                      {dispute.responses.length > 0 && (
                        <span className="ml-2">• {dispute.responses.length} response{dispute.responses.length !== 1 ? 's' : ''}</span>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedDispute(dispute)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Dispute Modal */}
      <CreateDisputeModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchDisputes}
      />

      {/* Dispute Detail Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Dispute Details</h2>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Dispute Content */}
              <div className="space-y-6">
                {/* Header Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{selectedDispute.subject}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusConfig[selectedDispute.status].color)}>
                        {statusConfig[selectedDispute.status].label}
                      </span>
                      <span className={cn('text-xs font-medium', priorityConfig[selectedDispute.priority].color)}>
                        {priorityConfig[selectedDispute.priority].label}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{selectedDispute.description}</p>
                  <div className="text-xs text-gray-500">
                    Created on {formatDate(selectedDispute.createdAt)}
                  </div>
                </div>

                {/* Resolution (if any) */}
                {selectedDispute.resolution && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-green-800 mb-2">Resolution</h4>
                    <p className="text-sm text-green-700">{selectedDispute.resolution}</p>
                    {selectedDispute.resolvedAt && (
                      <p className="text-xs text-green-600 mt-2">
                        Resolved on {formatDate(selectedDispute.resolvedAt)}
                      </p>
                    )}
                  </div>
                )}

                {/* Responses */}
                {selectedDispute.responses.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Responses</h4>
                    <div className="space-y-4">
                      {selectedDispute.responses.map((response) => (
                        <div
                          key={response.id}
                          className={cn(
                            'p-4 rounded-lg',
                            response.isAdmin 
                              ? 'bg-blue-50 border border-blue-200'
                              : 'bg-gray-50 border border-gray-200'
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900">
                                {response.user.full_name}
                              </span>
                              {response.isAdmin && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(response.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}