
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExploreContentItem } from './types';

interface CTACardProps {
  item: ExploreContentItem;
}

const CTACard: React.FC<CTACardProps> = ({ item }) => {
  return (
    <div 
      className="border-2 border-dashed p-6 text-center"
      style={{ 
        borderRadius: '8px',
        background: 'var(--bg-card)',
        borderColor: 'var(--border-hairline)'
      }}
    >
      <Plus className="h-8 w-8 mx-auto mb-3" style={{ color: 'var(--accent-primary)' }} />
      <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>{item.ctaTitle || item.title}</h3>
      <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{item.ctaDescription || 'Share your golf moments'}</p>
      <Button size="sm" style={{ background: 'var(--accent-primary)', color: 'var(--text-primary)' }} className="hover:opacity-90">
        <Plus className="h-4 w-4 mr-2" />
        {item.ctaButton || 'Create Post'}
      </Button>
    </div>
  );
};

export default CTACard;
