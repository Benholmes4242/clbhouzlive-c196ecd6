// ActorSheet - list of personal + claimed business actors.

import { Check } from 'lucide-react';
import BottomSheet from './BottomSheet';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { ActiveActor } from '@/types/actor';
import { SquircleAvatar, DARK_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { CT } from '@/features/_shared/composerTokens';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (a: ActiveActor) => void;
  selectedId: string | null;
}

export default function ActorSheet({ open, onClose, onSelect, selectedId }: Props) {
  const { availableActors } = useActiveActor();
  return (
    <BottomSheet open={open} title="Posting as" onClose={onClose}>
      {availableActors.map(a => {
        const active = a.id === selectedId;
        return (
          <button key={`${a.type}:${a.id}`} onClick={() => { onSelect(a); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', border: 0, borderTop: `1px solid ${CT.hairline}`, padding: '12px 16px', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}>
            <SquircleAvatar src={a.avatarUrl ?? null} alt={a.name} size={40} hairlineRing ringColor={DARK_HAIRLINE} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, color: CT.ink, fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 12, color: CT.secondary }}>{a.type === 'business' ? 'Business' : 'Personal'}</div>
            </div>
            {active && <Check size={18} color={CT.amber} />}
          </button>
        );
      })}
    </BottomSheet>
  );
}
