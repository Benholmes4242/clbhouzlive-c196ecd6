import React from 'react';

const ClubhouzLoading: React.FC = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto">
          <img 
            src="/lovable-uploads/47c9c183-0718-432a-bf49-9150f7beceb0.png"
            alt="Clubhouz"
            className="w-full h-full object-contain animate-pulse"
          />
        </div>
      </div>
    </div>
  );
};

export default ClubhouzLoading;