
import React from 'react';
import { Card } from '@/components/ui/card';

const LoadingSkeleton = () => {
  return (
    <div className="space-y-6 pb-20">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-0 shadow-sm animate-pulse">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 rounded-full" style={{ backgroundColor: '#6e9277', opacity: 0.3 }}></div>
              <div className="space-y-1">
                <div className="h-4 rounded w-24" style={{ backgroundColor: '#6e9277', opacity: 0.2 }}></div>
                <div className="h-3 rounded w-32" style={{ backgroundColor: '#6e9277', opacity: 0.2 }}></div>
              </div>
            </div>
            <div className="h-4 rounded mb-3" style={{ backgroundColor: '#6e9277', opacity: 0.2 }}></div>
            <div className="h-80 rounded" style={{ backgroundColor: '#6e9277', opacity: 0.2 }}></div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
