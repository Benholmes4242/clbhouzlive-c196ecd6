import React from 'react';
import { Button } from '@/components/ui/button';
import { Grid3X3, List } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'cards' | 'list';
  onViewChange: (view: 'cards' | 'list') => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ currentView, onViewChange }) => {
  return (
    <div 
      className="flex items-center bg-white/5 backdrop-blur-2xl border border-white/20 shadow-[0_0_20px_rgba(0,0,0,0.2)] rounded-full p-1" 
      style={{ backdropFilter: 'blur(40px) saturate(180%)' }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-full" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('cards')}
        className={`relative rounded-full h-9 px-3 text-xs font-medium transition-all ${
          currentView === 'cards'
            ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
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
        className={`relative rounded-full h-9 px-3 text-xs font-medium transition-all ${
          currentView === 'list'
            ? 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
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