interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'blue' | 'gray' | 'white';
  className?: string;
  text?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
};

const colorClasses = {
  blue: 'border-blue-200 border-t-blue-600',
  gray: 'border-gray-200 border-t-gray-600',
  white: 'border-white/20 border-t-white',
};

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'blue', 
  className = '',
  text
}: LoadingSpinnerProps) {
  if (text) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
        <div 
          className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]}`}
          role="status"
          aria-label="Loading"
        >
          <span className="sr-only">Loading...</span>
        </div>
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      </div>
    );
  }

  return (
    <div 
      className={`animate-spin rounded-full border-2 ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}

// Button spinner component for inline use
export function ButtonSpinner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-block w-4 h-4 animate-spin rounded-full border-2 border-gray-300 border-t-white ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}