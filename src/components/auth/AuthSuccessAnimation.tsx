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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-fade-in" style={{ background: '#F8FAFC' }}>
      <div className="flex flex-col items-center gap-3 animate-scale-in">
        {/* Success checkmark circle */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full blur-xl animate-pulse" style={{ background: 'rgba(247,147,30,0.20)' }} />
          
          {/* Main circle */}
          <div className="relative w-20 h-20 rounded-full flex items-center justify-center shadow-lg" style={{ background: '#F7931E', boxShadow: '0 10px 30px rgba(247,147,30,0.35)' }}>
            <Check className="w-10 h-10 text-white stroke-[3]" />
          </div>
        </div>

        {/* Success message */}
        {message && (
          <p className="text-lg font-medium" style={{ color: '#1C1C1E' }}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
