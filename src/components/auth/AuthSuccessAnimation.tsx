import { Check } from 'lucide-react';
import { useEffect } from 'react';

interface AuthSuccessAnimationProps {
  message?: string;
  onComplete: () => void;
  duration?: number;
}

export function AuthSuccessAnimation({ 
  message = "Success!", 
  onComplete,
  duration = 800 
}: AuthSuccessAnimationProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="flex flex-col items-center gap-3 animate-scale-in">
        {/* Success checkmark circle */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-green-500/20 blur-xl animate-pulse" />
          
          {/* Main circle */}
          <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/50">
            <Check className="w-10 h-10 text-white stroke-[3]" />
          </div>
        </div>

        {/* Success message */}
        {message && (
          <p className="text-white text-lg font-medium">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
