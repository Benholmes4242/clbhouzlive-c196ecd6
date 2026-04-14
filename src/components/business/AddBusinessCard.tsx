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
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(247,147,30,0.10)', border: '1px solid rgba(247,147,30,0.20)' }}>
          <Building2 className="w-8 h-8" style={{ color: '#F7931E' }} />
        </div>

        <h2 className="text-[18px] font-bold text-foreground mb-2">
          No business profiles yet
        </h2>

        <p className="text-[14px] text-muted-foreground max-w-[260px] mb-8">
          Create a profile for your golf club, academy, or brand.
        </p>

        <button
          onClick={onClick}
          className="text-white min-h-[50px] rounded-2xl px-8 text-[15px] font-semibold active:scale-[0.97] transition-all"
          style={{ background: '#F7931E' }}
        >
          Create Business Profile
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
        className="w-full flex items-center gap-3.5 p-4 rounded-2xl transition-colors min-h-[44px]"
        style={{ background: '#ffffff', border: '2px dashed rgba(15,23,42,0.12)' }}
      >
        {/* Icon in muted circle */}
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(15,23,42,0.05)', border: '1px solid rgba(15,23,42,0.07)' }}>
          <Plus className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-[14px] font-semibold text-foreground">
            Add another business
          </p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            Create a new business profile
          </p>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>
    </motion.div>
  );
}
