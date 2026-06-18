import { motion } from 'framer-motion';
import { Plus, Building2, ChevronRight } from 'lucide-react';
import { BIZ } from './businessTokens';

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
        transition={{ duration: 0.3, ease: BIZ.ease }}
        className="flex flex-col items-center justify-center py-20 px-6 text-center"
      >
        {/* Icon */}
        <div
          className="w-16 h-16 flex items-center justify-center mb-5"
          style={{
            background: BIZ.amberTint,
            border: `1px solid ${BIZ.amberHair}`,
            borderRadius: BIZ.rCard,
          }}
        >
          <Building2 className="w-8 h-8" style={{ color: BIZ.amber }} />
        </div>

        <h2 className="text-[18px] font-bold mb-2" style={{ color: BIZ.ink }}>
          No business profiles yet
        </h2>

        <p className="text-[14px] max-w-[260px] mb-8" style={{ color: BIZ.inkMute }}>
          Create a profile for your golf club, academy, or brand.
        </p>

        <button
          onClick={onClick}
          className="text-white min-h-[50px] px-8 text-[15px] font-semibold active:scale-[0.97] transition-all"
          style={{ background: BIZ.amber, borderRadius: BIZ.rCard }}
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
      transition={{ delay: 0.15, duration: 0.2, ease: BIZ.ease }}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3.5 p-4 transition-colors min-h-[44px]"
        style={{
          background: BIZ.card,
          border: `2px dashed ${BIZ.hairDashed}`,
          borderRadius: BIZ.rCard,
        }}
      >
        {/* Icon in muted circle */}
        <div
          className="w-10 h-10 flex items-center justify-center shrink-0"
          style={{
            background: BIZ.hairSoft,
            border: `1px solid ${BIZ.hair}`,
            borderRadius: BIZ.rInner,
          }}
        >
          <Plus className="w-5 h-5" style={{ color: BIZ.inkMute }} />
        </div>

        <div className="flex-1 min-w-0 text-left">
          <p className="text-[14px] font-semibold" style={{ color: BIZ.ink }}>
            Add another business
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: BIZ.inkMute }}>
            Create a new business profile
          </p>
        </div>

        <ChevronRight className="w-5 h-5 shrink-0" style={{ color: BIZ.inkMute }} />
      </button>
    </motion.div>
  );
}
