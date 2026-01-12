import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlassSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  rightElement?: React.ReactNode;
}

/**
 * Unified Glass Sheet container for all Create Moment sheets.
 * Frosted glass background, consistent handle, header, and motion.
 */
export const GlassSheet: React.FC<GlassSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  showCloseButton = true,
  rightElement,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div 
        className={cn(
          "fixed inset-x-0 bottom-0 z-50",
          "animate-in slide-in-from-bottom duration-300 ease-out",
          className
        )}
      >
        <div 
          className={cn(
            "relative rounded-t-[28px] overflow-hidden",
            "bg-white/85 dark:bg-slate-900/90",
            "backdrop-blur-xl",
            "border border-white/20 dark:border-white/10",
            "shadow-[0_-8px_32px_rgba(0,0,0,0.12)]"
          )}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-300/80 dark:bg-slate-600/80" />
          </div>
          
          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-4">
            <div className="flex-1 min-w-0 pr-3">
              <h2 className="text-lg font-semibold text-foreground tracking-tight">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {rightElement}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center",
                    "bg-slate-100/80 dark:bg-slate-800/80",
                    "backdrop-blur-md",
                    "border border-slate-200/50 dark:border-slate-700/50",
                    "text-muted-foreground hover:text-foreground",
                    "transition-all duration-200",
                    "active:scale-95"
                  )}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          
          {/* Content */}
          <div className="max-h-[80vh] overflow-y-auto overscroll-contain">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default GlassSheet;
