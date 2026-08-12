import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import type { ActiveActor } from '@/types/actor';

// Only the trigger chevron is theme-dependent; the sheet is always light.
const PALETTE = {
  dark: {
    // FeedCard footer is NOT inside .hcp-dark scope, so we can't rely on
    // var(--hcp-t-60) here — resolve to a concrete color.
    chevron: 'rgba(255, 255, 255, 0.7)',
  },
  light: {
    chevron: '#64748B',
  },
};

export interface FeedActorPickerValue {
  id: string;
  type: string;
}

interface FeedActorPickerProps {
  /** Local "acting as" actor for this card. Falls back to the global activeActor. */
  value?: FeedActorPickerValue | null;
  onChange?: (actor: ActiveActor) => void;
  /** Visual theme. Defaults to 'dark' (Clubhouse). LightFeedCard passes 'light'. */
  theme?: 'light' | 'dark';
}

export const FeedActorPicker: React.FC<FeedActorPickerProps> = ({ value, onChange, theme = 'dark' }) => {
  const c = PALETTE[theme];
  const { activeActor, availableActors } = useActiveActor();
  const [sheetOpen, setSheetOpen] = useState(false);

  const current =
    (value ? availableActors.find((a) => a.id === value.id && a.type === value.type) : null) ??
    activeActor;

  if (!current) return null;

  const hasMultiple = availableActors.length > 1;

  const avatar = (
    <SquircleAvatar
      size={24}
      src={current.avatarUrl ?? undefined}
      alt={current.name}
      userId={current.type === 'personal' ? current.id : null}
      hairlineRing
    />
  );

  if (!hasMultiple) {
    return (
      <div
        aria-label={`Acting as ${current.name}`}
        style={{ display: 'inline-flex', alignItems: 'center' }}
      >
        {avatar}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setSheetOpen(true);
        }}
        aria-label={`Acting as ${current.name} — tap to switch`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        {avatar}
        <ChevronDown size={14} color={c.chevron} strokeWidth={1.75} />
      </button>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        variant="light"
        style={{ background: '#F8FAFC' }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ padding: '4px 8px 8px' }}
        >
          <div
            style={{
              padding: '12px 12px 8px',
              fontFamily: 'Geist, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              ...KICKER,
              color: '#0F172A',
              fontFeatureSettings: '"kern" 1, "liga" 1',
            }}
          >
            POST AS
          </div>
          {availableActors.map((a) => {
            const isActive = a.id === current.id && a.type === current.type;
            return (
              <button
                key={`${a.type}:${a.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.(a);
                  setSheetOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                  background: isActive ? 'rgba(15, 23, 42, 0.05)' : 'transparent',
                  border: 'none',
                  padding: 12,
                  borderRadius: 12,
                  cursor: 'pointer',
                  color: '#0F172A',
                  textAlign: 'left',
                }}
              >
                <SquircleAvatar
                  size={36}
                  src={a.avatarUrl ?? undefined}
                  alt={a.name}
                  userId={a.type === 'personal' ? a.id : null}
                  hairlineRing
                  ringColor={LIGHT_HAIRLINE}
                />

                <span style={{ fontSize: 15, fontWeight: 600, flex: 1 }}>{a.name}</span>
                {isActive && <Check size={18} color="#F7931E" />}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
};

export default FeedActorPicker;
