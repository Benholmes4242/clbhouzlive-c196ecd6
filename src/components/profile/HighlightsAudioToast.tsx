import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';

interface HighlightsAudioToastProps {
  show: boolean;
  onTap: () => void;
}

const HighlightsAudioToast: React.FC<HighlightsAudioToastProps> = ({ show, onTap }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!isVisible) return null;

  return (
    <div 
      className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-opacity duration-300"
      onClick={onTap}
    >
      <Volume2 className="w-4 h-4" />
      <span className="text-sm">Tap to enable sound</span>
    </div>
  );
};

export default HighlightsAudioToast;