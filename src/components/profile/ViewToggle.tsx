import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'cards' | 'list';
  onViewChange: (view: 'cards' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('cards')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'cards'
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <Grid3X3 className="h-3 w-3 mr-1" />
        Cards
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('list')}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
          currentView === 'list'
            ? 'bg-white/20 text-white hover:bg-white/30'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        }`}
      >
        <List className="h-3 w-3 mr-1" />
        List
      </Button>
    </div>
  );
};

export default ViewToggle;