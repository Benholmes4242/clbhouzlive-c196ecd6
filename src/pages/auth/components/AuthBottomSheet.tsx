import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TITLE, BODY } from '@/lib/tokens/type';

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
          background: 'rgba(0, 0, 0, 0.55)',
        }}
        onClick={onClose}
      />
      
      {/* Sheet - light surface */}
      <div 
        className={cn(
          "fixed bottom-0 inset-x-0 mx-auto z-50 w-full max-w-[480px] md:max-w-[440px]",
          "rounded-t-[32px]",
          "transition-all duration-[380ms] ease-out",
          "pb-safe",
          isAnimating 
            ? "translate-y-0 opacity-100" 
            : "translate-y-full opacity-0"
        )}
        style={{
          background: 'rgba(21,23,31,0.92)',
          backdropFilter: 'blur(28px)',
          WebkitBackdropFilter: 'blur(28px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.20)' }} />
        </div>
        
        {/* Header with close button */}
        <div className="flex items-start justify-between px-6 pb-2">
          <div className="flex-1 pr-4">
            {title && (
              <div>
                <h2
                  style={{
                    ...TITLE,
                    color: 'rgba(255,255,255,0.96)',
                  }}
                >
                  {title}
                </h2>
              </div>
            )}
            {subtitle && (
              <p 
                style={{ 
                  ...BODY,
                  color: 'rgba(255,255,255,0.72)',
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
              background: 'rgba(255,255,255,0.08)',
            }}
          >
            <X className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.55)' }} />
          </button>
        </div>
        
        {/* Content */}
        <div className="px-6 pb-8">
          {children}
        </div>
      </div>
    </>
  );
};

export default AuthBottomSheet;
