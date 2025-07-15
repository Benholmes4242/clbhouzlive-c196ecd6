import React from 'react';

const InfiniteScrollLoader: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="relative">
        {/* Animated spinner with Clbhouz branding */}
        <div 
          className="w-8 h-8 border-3 border-gray-300 border-t-transparent rounded-full animate-spin"
          style={{ borderTopColor: '#6e9277' }}
        />
        
        {/* Pulsing background circle */}
        <div 
          className="absolute inset-0 w-8 h-8 rounded-full animate-pulse opacity-20"
          style={{ backgroundColor: '#6e9277' }}
        />
      </div>
      
      <span className="ml-3 text-sm text-muted-foreground animate-pulse">
        Loading more posts...
      </span>
    </div>
  );
};

export default InfiniteScrollLoader;