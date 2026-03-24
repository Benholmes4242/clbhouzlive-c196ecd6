import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EXPLORER_TIERS, type ExplorerTier } from '@/config/explorerTiers';

interface ExplorerTierLadderProps {
  currentTier: ExplorerTier;
}

export function ExplorerTierLadder({ currentTier }: ExplorerTierLadderProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentIndex = EXPLORER_TIERS.findIndex(t => t.id === currentTier.id);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-center active:opacity-70 transition-opacity"
        style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--accent-amber))', padding: '6px 0' }}
      >
        {isOpen ? 'Hide Tier Ladder ↑' : 'View Tier Ladder ↓'}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-1.5 pt-1">
              {EXPLORER_TIERS.map((tier, index) => {
                const isCurrent = tier.id === currentTier.id;
                const isUnlocked = index <= currentIndex;
                const isLocked = index > currentIndex;

                return (
                  <div
                    key={tier.id}
                    className="flex items-center gap-3"
                    style={{
                      padding: '10px 14px',
                      borderRadius: 14,
                      opacity: isLocked ? 0.45 : 1,
                      backgroundColor: isCurrent ? `${tier.color}10` : 'hsl(var(--card))',
                      border: isCurrent
                        ? `1.5px solid ${tier.color}40`
                        : '1.5px solid hsl(var(--border))',
                    }}
                  >
                    <span style={{ fontSize: 20 }}>{tier.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground" style={{ fontSize: 13, fontWeight: 700 }}>
                        {tier.name}
                      </p>
                      <p className="text-muted-foreground" style={{ fontSize: 11 }}>
                        {tier.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isCurrent && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: tier.color,
                            backgroundColor: `${tier.color}15`,
                            padding: '2px 8px',
                            borderRadius: 6,
                          }}
                        >
                          Current
                        </span>
                      )}
                      {isUnlocked && !isCurrent && (
                        <span style={{ fontSize: 13, color: '#3EBD93' }}>✓</span>
                      )}
                      {isLocked && (
                        <span className="text-muted-foreground" style={{ fontSize: 10 }}>
                          {tier.minCountries}+ countries
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
