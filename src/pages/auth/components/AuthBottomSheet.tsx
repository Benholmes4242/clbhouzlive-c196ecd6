import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

const AuthBottomSheet: React.FC<AuthBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });
    } else {
      setIsAnimating(false);
      // Wait for exit animation to complete
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop - subtle blur, no additional darkness */}
      <div 
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-[350ms] ease-out",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          backdropFilter: 'blur(4px)',
          background: 'rgba(0, 0, 0, 0.45)',
        }}
        onClick={onClose}
      />
      
      {/* Sheet - matches hero navy surface */}
      <div 
        className={cn(
          "fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[480px]",
          "rounded-t-[32px]",
          "transition-all duration-[380ms] ease-out",
          "pb-safe",
          isAnimating 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full opacity-0"
        )}
        style={{
          background: '#0C1119',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.15)' }} />
        </div>
        
        {/* Header with close button */}
        <div className="flex items-start justify-between px-6 pb-3">
          <div className="flex-1 pr-4">
            {title && (
              <h2 
                style={{ 
                  fontSize: 20,
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '-0.03em',
                  marginBottom: 4,
                }}
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p 
                className="text-[14px] text-white/65"
                style={{ 
                  lineHeight: '1.45',
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
            }}
          >
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-8 pt-2">
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthBottomSheet;
