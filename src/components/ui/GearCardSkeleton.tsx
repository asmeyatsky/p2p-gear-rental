interface GearCardSkeletonProps {
  count?: number;
}

function SingleSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="h-48 w-full bg-gray-300"></div>
      
      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-4 bg-gray-300 rounded mb-2"></div>
        
        {/* Description */}
        <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2 mb-4"></div>
        
        {/* Price and location */}
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 rounded w-20"></div>
          <div className="h-4 bg-gray-300 rounded w-16"></div>
        </div>
        
        {/* Category badge */}
        <div className="mt-3 h-6 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function GearCardSkeleton({ count = 1 }: GearCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <SingleSkeleton key={index} />
      ))}
    </>
  );
}