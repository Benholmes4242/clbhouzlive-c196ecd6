import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Building2, ChevronRight } from 'lucide-react';

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
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        {/* Icon in brand amber circle */}
        <div className="w-16 h-16 rounded-full bg-[#C1A84C]/10 flex items-center justify-center mb-4">
          <Building2 className="w-7 h-7 text-[#C1A84C]" />
        </div>
        
        <h3 className="text-lg font-bold text-foreground mb-1">
          Create your first business profile
        </h3>
        
        <p className="text-sm text-muted-foreground max-w-[280px] mb-6">
          Represent a golf club, coach, brand, or venue on clbhouz.
        </p>
        
        <button
          onClick={onClick}
          className="inline-flex items-center gap-2 bg-[#334E3D] text-white min-h-[48px] rounded-full px-8 text-sm font-medium active:scale-[0.97] transition-transform"
        >
          <Plus className="h-4 w-4" />
          Create business profile
        </button>
      </motion.div>
    );
  }

  // Add another row — dashed card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.2, ease: 'easeOut' }}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 p-4 bg-card border border-dashed border-border rounded-2xl active:scale-[0.98] transition-transform min-h-[44px]"
      >
        {/* Icon in muted circle */}
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5 text-muted-foreground" />
        </div>
        
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-semibold text-foreground">
            Add another business
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage multiple clubs, coaches, or golf brands
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
      </button>
    </motion.div>
  );
}