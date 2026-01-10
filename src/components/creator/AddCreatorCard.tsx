import { Plus, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AddCreatorCardProps {
  onClick: () => void;
  isFirst?: boolean;
}

export function AddCreatorCard({ onClick, isFirst = false }: AddCreatorCardProps) {
  if (isFirst) {
    // Empty state card for when user has no creator pages
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-white"
      >
        <div className="px-5 py-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold text-foreground mb-1">
            Create your first creator page
          </h3>
          <p className="text-sm text-muted-foreground mb-5 max-w-[260px]">
            Share content and build your audience with a dedicated creator profile.
          </p>
          <button
            onClick={onClick}
            className={cn(
              "inline-flex items-center justify-center gap-1.5",
              "px-5 py-2.5 rounded-full",
              "bg-primary text-primary-foreground text-sm font-medium",
              "hover:bg-primary/90 active:scale-[0.98] transition-all"
            )}
          >
            <Plus className="h-4 w-4" />
            Create creator page
          </button>
        </div>
      </motion.div>
    );
  }

  // Compact add row for when user already has creator pages
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: 'easeOut', delay: 0.1 }}
      onClick={onClick}
      className={cn(
        "w-full bg-white py-4 px-4",
        "flex items-center justify-center gap-2",
        "text-sm font-medium text-primary",
        "hover:bg-muted/30 active:scale-[0.99] transition-all"
      )}
    >
      <Plus className="h-4 w-4" />
      Add another creator page
    </motion.button>
  );
}
