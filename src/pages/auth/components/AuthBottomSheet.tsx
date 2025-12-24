import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuthBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const AuthBottomSheet: React.FC<AuthBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-opacity"
        style={{ backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />
      
      {/* Sheet - using glass system matching Clubhouse header/footer */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "rounded-t-[28px]",
          "transform transition-transform duration-300 ease-out",
          "pb-safe",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          background: 'rgba(10, 10, 10, 0.78)',
          backdropFilter: 'blur(22px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 -10px 30px rgba(0, 0, 0, 0.55)',
        }}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>
        
        {/* Header with close button */}
        <div className="flex items-center justify-between px-6 pb-4">
          <h2 className="text-lg font-semibold text-white">
            {title || ''}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
            }}
          >
            <X className="w-4 h-4 text-white/70" />
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