import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
      <DialogContent className="max-w-md bg-transparent border-0 shadow-none">
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
              <DialogTitle className="text-white text-lg font-semibold">Sort & View Options</DialogTitle>
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
      </DialogContent>
    </Dialog>
  );
};

export default SortViewModal;