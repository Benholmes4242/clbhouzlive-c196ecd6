import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Plus, Building2, ChevronRight } from 'lucide-react';
import { BIZ } from './businessTokens';


interface AddBusinessCardProps {
  onClick: () => void;
  isFirst?: boolean;
}

export function AddBusinessCard({ onClick, isFirst = false }: AddBusinessCardProps) {
  const { t } = useTranslation('common');
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

        <h2 className="text-[17px] font-semibold mb-2" style={{ color: BIZ.ink }}>
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

  // Add another row — solid panel. A placeholder edge treatment would say
  // something is missing; this is a real, permanent control, so 1px solid.
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.2, ease: BIZ.ease }}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center gap-2.5 transition-opacity active:opacity-60"
        style={{
          background: BIZ.card,
          border: '1px solid #EDF0F3',
          borderRadius: 16,
          padding: '15px 16px',
          minHeight: 44,
        }}
      >
        <Plus className="shrink-0" style={{ width: 16, height: 16, color: BIZ.inkMute }} />
        <span className="flex-1 text-left" style={{ color: BIZ.ink, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {t('business.card.addAnother')}
        </span>
        <ChevronRight className="shrink-0" style={{ width: 14, height: 14, color: BIZ.inkFaint }} />
      </button>
    </motion.div>
  );
}

