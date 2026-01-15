import { Plus, Sparkles, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface AddCreatorCardProps {
  onClick: () => void;
  isFirst?: boolean;
}

export function AddCreatorCard({ onClick, isFirst = false }: AddCreatorCardProps) {
  if (isFirst) {
    // Full empty state for zero creator pages
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        {/* Icon in gradient circle - Hub standard */}
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center mb-4">
          <Sparkles className="w-7 h-7 text-[#64748b]" />
        </div>
        
        {/* Title */}
        <h3 className="text-base font-semibold text-[#1e293b] mb-1">
          Create your first creator page
        </h3>
        
        {/* Description */}
        <p className="text-sm text-[#64748b] max-w-[280px] mb-6">
          Share content and build your audience with a dedicated creator profile.
        </p>
        
        {/* CTA Button */}
        <Button onClick={onClick} size="lg" className="gap-2">
          <Plus className="h-4 w-4" />
          Create creator page
        </Button>
      </motion.div>
    );
  }

  // Add another row with gradient icon - matches business pattern
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.2, ease: 'easeOut' }}
    >
      {/* Hairline divider above only */}
      <div className="h-px bg-border/30" />
      
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 px-4 py-5 bg-white hover:bg-[#f8fafc] active:bg-muted/40 transition-colors"
      >
        {/* Icon in gradient circle */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/60 flex items-center justify-center flex-shrink-0">
          <Plus className="w-5 h-5 text-[#64748b]" />
        </div>
        
        {/* Text */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-[#1e293b]">
            Add another creator page
          </p>
          <p className="text-xs text-[#64748b] mt-0.5">
            Manage multiple creator identities or channels
          </p>
        </div>

        {/* Chevron */}
        <ChevronRight className="w-5 h-5 text-[#94a3b8] flex-shrink-0" />
      </button>
    </motion.div>
  );
}
