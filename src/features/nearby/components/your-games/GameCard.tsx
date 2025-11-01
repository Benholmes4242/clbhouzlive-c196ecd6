import * as React from 'react';
import { Game as GameType, Participant, CardVariant } from './types';
import { formatExpires } from '@/lib/formatExpires';
import { PlayerRow } from './PlayerRow';
import { SlotsPill } from './SlotsPill';
import { useMinuteTick } from '@/hooks/useMinuteTick';

interface GameCardProps {
  game: GameType;
  variant: CardVariant; // 'hosting' | 'joined'
  host?: Participant | null;
  members?: Participant[]; // guests + tagged
  defaultOpen?: boolean;

  // Actions (provide no-ops where not used)
  onInvite?: (gameId: string) => void;
  onEdit?: (gameId: string) => void;
  onCancel?: (gameId: string) => void;
  onMessageHost?: (gameId: string) => void;
  onLeave?: (gameId: string) => void;

  // Optional: control expand from parent
  isOpen?: boolean;
  onToggle?: (gameId: string, next: boolean) => void;
}

export const GameCard: React.FC<GameCardProps> = ({
  game,
  variant,
  host,
  members = [],
  defaultOpen = false,
  onInvite,
  onEdit,
  onCancel,
  onMessageHost,
  onLeave,
  isOpen,
  onToggle,
}) => {
  useMinuteTick(); // Auto-refresh expiry time
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen);
  const open = isOpen ?? internalOpen;

  const toggle = () => {
    const next = !open;
    setInternalOpen(next);
    onToggle?.(game.id, next);
  };

  // Derived
  const filled = Math.max(0, (game.slots_total ?? 0) - (game.slots_open ?? 0));
  const start = new Date(game.start_time);
  const dateStr = start.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  const timeStr = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  const expiresLabel = formatExpires(game.expires_at);

  return (
    <section
      className="rounded-2xl bg-white/[0.04] border border-white/10 shadow-[0_20px_48px_rgba(0,0,0,.5)] px-4 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
      role="button"
      aria-expanded={open}
      onClick={toggle}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      }}
    >
      {/* Header row */}
      <div className="flex items-center gap-3">
        <h3 className="text-[16.5px] font-semibold flex-1 min-w-0 truncate text-white/95">
          {game.course_name}
        </h3>

        {/* Capacity pill with bump animation */}
        <SlotsPill
          slotsOpen={game.slots_open}
          slotsTotal={game.slots_total}
          className="ml-auto"
        />

        {/* Chevron */}
        <svg
          className={`ml-2 h-5 w-5 text-white/70 transition-transform duration-200 ease-out ${open ? 'rotate-180' : 'rotate-0'}`}
          viewBox="0 0 20 20" 
          aria-hidden="true"
        >
          <path d="M5 7l5 6 5-6" fill="currentColor" />
        </svg>
      </div>

      {/* Meta row */}
      <div className="mt-2 text-[13.5px] text-white/80 space-y-1">
        <div className="flex items-center gap-2">
          <span className="opacity-80">📍</span>
          <span className="truncate">{game.course_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-80">🗓️</span>
          <span>{dateStr} • {timeStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="opacity-80">⏳</span>
          <span>{expiresLabel}</span>
        </div>
      </div>

      {/* Expandable */}
      <div
        className={`overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out mt-3
                    ${open ? 'grid grid-rows-[1fr] opacity-100' : 'grid grid-rows-[0fr] opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="min-h-0">
          {/* Note */}
          {game.note && (
            <div className="mb-3 text-[13px] text-white/70 bg-white/5 rounded-lg p-3">
              <div className="font-medium text-white/80 mb-1">Note:</div>
              {game.note}
            </div>
          )}

          {/* Players */}
          <div className="mt-2 space-y-3">
            {/* HOST */}
            <div>
              <div className="text-[12px] font-semibold tracking-wide text-white/70 mb-2 flex items-center justify-between uppercase">
                <span>Host</span><span>{host ? 1 : 0}</span>
              </div>
              {host && (
                <div className="space-y-2">
                  <PlayerRow p={host} isHost={true} />
                </div>
              )}
            </div>

            {/* MEMBERS */}
            {members.length > 0 && (
              <div>
                <div className="text-[12px] font-semibold tracking-wide text-white/70 mb-2 flex items-center justify-between uppercase">
                  <span>Members</span><span>{members.length}</span>
                </div>
                <div className="space-y-2" role="list">
                  {members.map((p, idx) => (
                    <PlayerRow key={p.user_id ?? `member-${idx}`} p={p} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-white/10" />

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {variant === 'hosting' ? (
              <>
                {onInvite && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                    onClick={() => onInvite(game.id)}
                  >
                    Invite
                  </button>
                )}
                {onEdit && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                    onClick={() => onEdit(game.id)}
                  >
                    Edit
                  </button>
                )}
                {onCancel && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-red-400/25 bg-red-500/10 hover:bg-red-500/15 text-red-300 text-sm font-medium transition-colors"
                    onClick={() => onCancel(game.id)}
                  >
                    Cancel Game
                  </button>
                )}
              </>
            ) : (
              <>
                {onMessageHost && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/14 active:bg-white/18 border border-white/15 text-sm font-medium text-white/90 transition-colors"
                    onClick={() => onMessageHost(game.id)}
                  >
                    Message Host
                  </button>
                )}
                {onLeave && (
                  <button
                    type="button"
                    className="px-3 py-2 rounded-lg border border-red-400/25 bg-red-500/10 hover:bg-red-500/15 text-red-300 text-sm font-medium transition-colors"
                    onClick={() => onLeave(game.id)}
                  >
                    Leave Game
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
