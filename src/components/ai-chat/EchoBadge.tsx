import React from 'react';
import { PiWaveform } from 'react-icons/pi';

interface EchoBadgeProps {
  onClick: () => void;
  onClose: () => void;
}

const EchoBadge: React.FC<EchoBadgeProps> = ({ onClick, onClose }) => {
  const handleClick = () => {
    onClose();
    onClick();
  };

  return (
    <div
      className="
        w-[140px] h-14
        rounded-full
        bg-gradient-to-br from-[#1D3557] to-[#2A9D8F]
        active:scale-95
        flex items-center justify-center
        relative overflow-hidden
        cursor-pointer
      "
      onClick={handleClick}
    >
      {/* Inner gradient highlight */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent via-white/10 to-white/20 opacity-60 motion-reduce:opacity-0" />
      
      {/* PiWaveform Icon and Text */}
      <div className="flex items-center justify-center gap-3">
        <div className="w-10 h-10 flex items-center justify-center">
          <PiWaveform 
            size={36} 
            className="text-white/90 transition-all duration-200 ease-in-out"
            style={{
              animation: 'echoWave 2s ease-in-out infinite'
            }}
          />
        </div>
        
        {/* Echo Text */}
        <span className="font-medium text-lg text-white/90 pr-2 animate-fade-in whitespace-nowrap flex items-center">
          Echo
        </span>
      </div>
    </div>
  );
};

export default EchoBadge;