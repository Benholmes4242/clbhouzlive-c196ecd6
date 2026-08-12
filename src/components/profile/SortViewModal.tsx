import React from 'react';
import { TITLE } from '@/lib/tokens/type';
import {
  Dialog,
  DialogPortal,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from '@/components/ui/button';
import { Grid3X3, List, ChevronDown, ChevronUp } from 'lucide-react';

export type SortType = 'rank-asc' | 'rank-desc' | 'recent';
export type ViewType = 'cards' | 'list';

interface SortViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSort: SortType;
  currentView: ViewType;
  onSortChange: (sort: SortType) => void;
  onViewChange: (view: ViewType) => void;
}

const SortViewModal: React.FC<SortViewModalProps> = ({
  isOpen,
  onClose,
  currentSort,
  currentView,
  onSortChange,
  onViewChange
}) => {
  const sortOptions = [
    { value: 'rank-asc', label: 'Rank: Low to High', icon: <ChevronUp className="h-4 w-4" /> },
    { value: 'rank-desc', label: 'Rank: High to Low', icon: <ChevronDown className="h-4 w-4" /> },
    { value: 'recent', label: 'Recently Played', icon: null }
  ] as const;

  const viewOptions = [
    { value: 'cards', label: 'Card View', icon: <Grid3X3 className="h-4 w-4" /> },
    { value: 'list', label: 'List View', icon: <List className="h-4 w-4" /> }
  ] as const;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogPrimitive.Content
          className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-md translate-x-[-50%] translate-y-[-50%] gap-4 border-0 bg-transparent p-0 shadow-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg"
        >
          <div 
            className="relative bg-white/10 border border-white/20 text-white p-6"
            style={{ 
              backdropFilter: 'blur(40px) saturate(180%)',
              borderRadius: '16px'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" style={{ borderRadius: '16px' }} />
            
            <div className="relative">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-white" style={TITLE}>Sort &amp; View Options</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Sort Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80">Sort by</h3>
                  <div className="space-y-2">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onSortChange(option.value)}
                        className={`relative w-full flex items-center gap-3 p-3 text-left transition-colors overflow-hidden ${
                          currentSort === option.value 
                            ? 'text-white' 
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {/* Liquid glass background for selected */}
                        {currentSort === option.value && (
                          <>
                            <div 
                              className="absolute inset-0 bg-white/20 border border-white/30"
                              style={{ 
                                backdropFilter: 'blur(40px) saturate(180%)',
                                borderRadius: '8px'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" style={{ borderRadius: '8px' }} />
                          </>
                        )}
                        
                        <div className="relative flex items-center gap-3">
                          {option.icon && <span>{option.icon}</span>}
                          <span className="font-medium">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* View Options */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white/80">View</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {viewOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onViewChange(option.value)}
                        className={`relative flex items-center gap-2 p-3 text-left transition-colors overflow-hidden ${
                          currentView === option.value 
                            ? 'text-white' 
                            : 'text-white/80 hover:bg-white/10'
                        }`}
                        style={{ borderRadius: '8px' }}
                      >
                        {/* Liquid glass background for selected */}
                        {currentView === option.value && (
                          <>
                            <div 
                              className="absolute inset-0 bg-white/20 border border-white/30"
                              style={{ 
                                backdropFilter: 'blur(40px) saturate(180%)',
                                borderRadius: '8px'
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" style={{ borderRadius: '8px' }} />
                          </>
                        )}
                        
                        <div className="relative flex items-center gap-2">
                          <span>{option.icon}</span>
                          <span className="font-medium text-sm">{option.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
};

export default SortViewModal;