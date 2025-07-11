
import React, { useEffect, useState } from 'react';

interface SnapToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
}

const SnapToast = ({ message, isVisible, onHide, duration = 2500 }: SnapToastProps) => {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldShow(true);
      const timer = setTimeout(() => {
        setShouldShow(false);
        setTimeout(onHide, 300); // Allow fade out animation
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onHide]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[9999] pointer-events-none">
      <div 
        className={`bg-black text-white px-6 py-3 rounded-lg shadow-lg transition-all duration-300 ${
          shouldShow ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        <p className="text-center font-medium">{message}</p>
      </div>
    </div>
  );
};

export default SnapToast;
