
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CTAContentItem } from './types';

interface CTACardProps {
  item: CTAContentItem;
}

const CTACard: React.FC<CTACardProps> = ({ item }) => {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-2 border-dashed border-amber-200 dark:border-amber-800 rounded-lg p-6 text-center">
      <Plus className="h-8 w-8 mx-auto mb-3 text-amber-600" />
      <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{item.description}</p>
      <Button size="sm" className="bg-[#2a2626] text-white hover:bg-[#2a2626]/90">
        <Plus className="h-4 w-4 mr-2" />
        Create Post
      </Button>
    </div>
  );
};

export default CTACard;
