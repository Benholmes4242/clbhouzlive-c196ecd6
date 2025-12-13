import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AddBusinessCardProps {
  onClick: () => void;
  isFirst?: boolean;
}

export function AddBusinessCard({ onClick, isFirst = false }: AddBusinessCardProps) {
  if (isFirst) {
    // Full empty state for zero businesses
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center py-20 px-6"
      >
        <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-muted/80 flex items-center justify-center">
          <Building2 className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Create your first business profile
        </h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
          Represent a golf club, coach, brand, or venue on Clbhouz.
        </p>
        <Button onClick={onClick} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create business profile
        </Button>
      </motion.div>
    );
  }

  // Flat add row - no card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.2, ease: 'easeOut' }}
    >
      {/* Hairline divider above */}
      <div className="h-px bg-border/30" />
      
      <button
        onClick={onClick}
        className="w-full flex items-center gap-4 px-4 py-4 hover:bg-muted/30 transition-colors active:bg-muted/40"
      >
        {/* Plus icon in circle */}
        <div className="h-10 w-10 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0">
          <Plus className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Text */}
        <div className="flex-1 min-w-0 text-left">
          <p className="font-medium text-foreground text-sm">
            Add another business
          </p>
          <p className="text-xs text-muted-foreground">
            Manage multiple clubs, coaches, or golf brands
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
      </button>
    </motion.div>
  );
}
