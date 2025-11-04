import React from 'react';

type SwingCoachScreenProps = {
  onClose: () => void;
};

export function SwingCoachScreen({ onClose }: SwingCoachScreenProps) {
  return (
    <div className="space-y-4 pb-6">
      <h2 className="text-xl font-semibold text-white">Swing Coach</h2>
      
      <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.6)' }}>
        <p className="text-[15px]">Swing coach interface coming soon</p>
      </div>
    </div>
  );
}
