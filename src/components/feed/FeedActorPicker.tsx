import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useActiveActor } from '@/context/ActiveActorContext';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import type { ActiveActor } from '@/types/actor';

const T2 = 'rgba(255,255,255,0.52)';

export interface FeedActorPickerValue {
  id: string;
  type: string;
}

interface FeedActorPickerProps {
  /** Local "acting as" actor for this card. Falls back to the global activeActor. */
  value?: FeedActorPickerValue | null;
  onChange?: (actor: ActiveActor) => void;
}

export const FeedActorPicker: React.FC<FeedActorPickerProps> = ({ value, onChange }) => {
  const { activeActor, availableActors } = useActiveActor();
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
      hideRing={current.type === 'business'}
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
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
          <ChevronDown size={14} color={T2} strokeWidth={1.75} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#0F172A',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.92)',
          minWidth: 200,
        }}
      >
        {availableActors.map((a) => {
          const isCurrent = a.id === current.id && a.type === current.type;
          return (
            <DropdownMenuItem
              key={`${a.type}:${a.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onChange?.(a);
              }}
              className="focus:!bg-white/[0.06] data-[highlighted]:!bg-white/[0.06] focus:!text-white"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: isCurrent ? 'rgba(255,255,255,0.06)' : 'transparent',
                color: isCurrent ? '#ffffff' : 'rgba(255,255,255,0.9)',
                cursor: 'pointer',
              }}
            >
              <SquircleAvatar
                size={24}
                src={a.avatarUrl ?? undefined}
                alt={a.name}
                userId={a.type === 'personal' ? a.id : null}
                hairlineRing
                hideRing={a.type === 'business'}
              />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{a.name}</span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FeedActorPicker;
