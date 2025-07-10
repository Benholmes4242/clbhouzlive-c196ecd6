
import React, { useEffect, useState } from 'react';

interface SnapToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  duration?: number;
  variant?: 'success' | 'error' | 'default';
}

const SnapToast = ({ message, isVisible, onHide, duration = 2500, variant = 'default' }: SnapToastProps) => {
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

  // Enhanced styling based on variant
  const getToastStyles = () => {
    switch (variant) {
      case 'success':
        return 'bg-green-500 text-white shadow-lg border border-green-600';
      case 'error':
        return 'bg-red-500 text-white shadow-lg border border-red-600';
      default:
        return 'bg-black text-white shadow-lg';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] pointer-events-none">
      <div 
        className={`${getToastStyles()} px-6 py-3 rounded-lg transition-all duration-300 animate-slide-in-up ${
          shouldShow ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        <p className="text-center font-medium">{message}</p>
      </div>
    </div>
  );
};

export default SnapToast;
