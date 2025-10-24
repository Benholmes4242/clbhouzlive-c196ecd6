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
      className="flex items-center p-0.5 h-10" 
      style={{ 
        background: 'var(--glass-bg)',
        backdropFilter: `blur(var(--glass-blur)) saturate(180%)`,
        WebkitBackdropFilter: `blur(var(--glass-blur)) saturate(180%)`,
        border: '1px solid var(--border-hairline)',
        borderRadius: '8px',
        boxShadow: '0 0 20px rgba(0,0,0,0.2)'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent" style={{ borderRadius: '8px' }} />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('cards')}
        className={`relative px-1.5 py-1 text-base font-medium transition-all ${
          currentView === 'cards'
            ? 'backdrop-blur-sm'
            : 'hover:bg-white/10'
        }`}
        style={{ 
          borderRadius: '6px',
          background: currentView === 'cards' ? 'rgba(255,255,255,0.15)' : 'transparent',
          color: currentView === 'cards' ? 'var(--text-primary)' : 'rgba(255,255,255,0.7)'
        }}
      >
        <Grid3X3 className="h-3 w-3 mr-0.5" />
        Cards
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('list')}
        className={`relative px-1.5 py-1 text-base font-medium transition-all ${
          currentView === 'list'
            ? 'backdrop-blur-sm'
            : 'hover:bg-white/10'
        }`}
        style={{ 
          borderRadius: '6px',
          background: currentView === 'list' ? 'rgba(255,255,255,0.15)' : 'transparent',
          color: currentView === 'list' ? 'var(--text-primary)' : 'rgba(255,255,255,0.7)'
        }}
      >
        <List className="h-3 w-3 mr-0.5" />
        List
      </Button>
    </div>
  );
};

export default ViewToggle;