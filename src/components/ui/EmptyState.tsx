import { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

// Default icons for common empty states
const defaultIcons = {
  search: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  gear: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
    </svg>
  ),
  rentals: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  reviews: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
};

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action, 
  className = '' 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="mx-auto max-w-md">
        {/* Icon */}
        <div className="mx-auto flex items-center justify-center">
          {icon}
        </div>

        {/* Title */}
        <h3 className="mt-6 text-lg font-medium text-gray-900">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-2 text-sm text-gray-500">
            {description}
          </p>
        )}

        {/* Action */}
        {action && (
          <div className="mt-6">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

// Predefined empty states for common scenarios
export const EmptyStates = {
  NoGearFound: ({ action }: { action?: ReactNode }) => (
    <EmptyState
      icon={defaultIcons.gear}
      title="No gear found"
      description="Try adjusting your search filters or browse all available gear."
      action={action}
    />
  ),

  NoSearchResults: ({ query, action }: { query?: string; action?: ReactNode }) => (
    <EmptyState
      icon={defaultIcons.search}
      title={query ? `No results for "${query}"` : "No search results"}
      description="Try different keywords or remove some filters to see more results."
      action={action}
    />
  ),

  NoRentals: ({ action }: { action?: ReactNode }) => (
    <EmptyState
      icon={defaultIcons.rentals}
      title="No rentals yet"
      description="When you rent or lend gear, your rental history will appear here."
      action={action}
    />
  ),

  NoReviews: ({ action }: { action?: ReactNode }) => (
    <EmptyState
      icon={defaultIcons.reviews}
      title="No reviews yet"
      description="Reviews from completed rentals will appear here."
      action={action}
    />
  ),

  NoGearListed: ({ action }: { action?: ReactNode }) => (
    <EmptyState
      icon={defaultIcons.gear}
      title="No gear listed"
      description="Start earning by listing your photography and videography equipment."
      action={action}
    />
  ),
};