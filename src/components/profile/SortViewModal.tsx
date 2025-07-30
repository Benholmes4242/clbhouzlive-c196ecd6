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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Sort & View Options</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Sort Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Sort by</h3>
            <div className="space-y-2">
              {sortOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={currentSort === option.value ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => onSortChange(option.value)}
                >
                  {option.icon && <span className="mr-2">{option.icon}</span>}
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* View Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">View</h3>
            <div className="grid grid-cols-2 gap-2">
              {viewOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={currentView === option.value ? "default" : "outline"}
                  className="justify-start"
                  onClick={() => onViewChange(option.value)}
                >
                  <span className="mr-2">{option.icon}</span>
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SortViewModal;