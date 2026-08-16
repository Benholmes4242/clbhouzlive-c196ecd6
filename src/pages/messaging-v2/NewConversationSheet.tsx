import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { X, Check } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useEntityPickerSearch,
  type PersonResult,
  type BusinessResult,
} from '@/features/search-v2/hooks/useEntityPickerSearch';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { usePlayedWith } from '@/hooks/messaging/usePlayedWith';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { canActorMessage } from '@/hooks/messaging/canActorMessage';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

const CANVAS = '#F8FAFC';
const INK = '#1F2428';
const SUB = '#8A9099';
const HAIRLINE = 'rgba(0,0,0,0.07)';

type Candidate = {
  actor_type: 'personal' | 'business';
  actor_id: string;
  name: string;
  avatar_url: string | null;
  verified?: boolean;
};

interface NewConversationSheetProps {
  open: boolean;
  onClose: () => void;
}

const NewConversationSheet: React.FC<NewConversationSheetProps> = ({ open, onClose }) => {
  const { t } = useTranslation('messaging');
  const navigate = useNavigate();
  const actor = useMessagingActor();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query, 250);
  const [selected, setSelected] = useState<Candidate[]>([]);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);

  // §5 the sheet opens on golfers you have played with, so it must know who
  // they are before the member types anything.
  const { user } = useSupabaseSession();
  const playedWith = usePlayedWith(user?.id, open);

  const { people, businesses, isLoading } = useEntityPickerSearch({
    query: debounced,
    enabled: open && debounced.trim().length > 0,
    limit: 8,
  });

  const candidates: Candidate[] = useMemo(() => {
    const personActors: Candidate[] = (people ?? []).map((p: PersonResult) => ({
      actor_type: 'personal',
      actor_id: p.id,
      name: p.display_name,
      avatar_url: p.avatar_url,
      verified: p.verified,
    }));
    const bizActors: Candidate[] = (businesses ?? []).map((b: BusinessResult) => ({
      actor_type: 'business',
      actor_id: b.id,
      name: b.name,
      avatar_url: b.logo_url,
      verified: b.verified,
    }));
    const list = [...personActors, ...bizActors];
    // Exclude the current actor itself.
    return list.filter(
      (c) => !(actor && c.actor_type === actor.actorType && c.actor_id === actor.actorId),
    );
  }, [people, businesses, actor]);

  const toggleSelect = useCallback((c: Candidate) => {
    setSelected((prev) => {
      const idx = prev.findIndex(
        (s) => s.actor_type === c.actor_type && s.actor_id === c.actor_id,
      );
      if (idx >= 0) {
        const next = prev.slice();
        next.splice(idx, 1);
        return next;
      }
      return [...prev, c];
    });
  }, []);

  const isSelected = useCallback(
    (c: Candidate) =>
      selected.some((s) => s.actor_type === c.actor_type && s.actor_id === c.actor_id),
    [selected],
  );

  // Intro framing shown when the acting business is targeting any personal.
  const showIntro = useMemo(() => {
    if (!actor || actor.actorType !== 'business') return false;
    return selected.some((s) => s.actor_type === 'personal');
  }, [actor, selected]);

  const reset = useCallback(() => {
    setQuery('');
    setSelected([]);
    setTitle('');
    setBusy(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const startDM = useCallback(async () => {
    if (!actor || selected.length !== 1 || busy) return;
    const target = selected[0];
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc('msg_start_direct', {
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_target_actor_type: target.actor_type,
        p_target_actor_id: target.actor_id,
      });
      if (error) throw error;
      const id = data as unknown as string;
      handleClose();
      navigate(`/messages/${id}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not start conversation');
      setBusy(false);
    }
  }, [actor, selected, busy, navigate, handleClose]);

  const createGroup = useCallback(async () => {
    if (!actor || selected.length < 2 || busy) return;
    setBusy(true);
    try {
      const members = selected.map((s) => ({
        actor_type: s.actor_type,
        actor_id: s.actor_id,
      }));
      const finalTitle =
        title.trim() ||
        selected
          .map((s) => s.name.split(' ')[0])
          .slice(0, 4)
          .join(', ');
      const { data, error } = await supabase.rpc('msg_create_group', {
        p_as_actor_type: actor.actorType,
        p_as_actor_id: actor.actorId,
        p_title: finalTitle,
        p_members: members as unknown as Json,
        p_avatar_url: undefined,
      });
      if (error) throw error;
      const id = data as unknown as string;
      handleClose();
      navigate(`/messages/${id}`);
    } catch (e) {
      console.error(e);
      toast.error('Could not create group');
      setBusy(false);
    }
  }, [actor, selected, title, busy, navigate, handleClose]);

  return (
    <BottomSheet open={open} onClose={handleClose} zIndexBase={1400}>
      <SheetHeader title={t('action.newMessage')} onClose={handleClose} />

      <div style={{ background: CANVAS, paddingBottom: 12 }}>
        {/* Selected chips */}
        {selected.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              padding: '12px 16px 4px',
            }}
          >
            {selected.map((s) => (
              <button
                key={`${s.actor_type}:${s.actor_id}`}
                type="button"
                onClick={() => toggleSelect(s)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px 4px 4px',
                  background: '#FFFFFF',
                  border: `0.5px solid ${HAIRLINE}`,
                  borderRadius: 999,
                  color: INK,
                  fontSize: 13,
                  fontWeight: 500,
                }}
              >
                <SquircleAvatar src={s.avatar_url ?? undefined} alt={s.name} size={20} hairlineRing />
                <span>{s.name}</span>
                <X size={14} color={SUB} />
              </button>
            ))}
          </div>
        )}

        {/* Search input */}
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.people')}
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              background: '#FFFFFF',
              border: `0.5px solid ${HAIRLINE}`,
              color: INK,
              fontSize: 15,
              outline: 'none',
            }}
          />
        </div>

        {/* Group title (only when 2+ selected) */}
        {selected.length >= 2 && (
          <div style={{ padding: '0 16px 12px' }}>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('group.namePlaceholder')}
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: 12,
                background: '#FFFFFF',
                border: `0.5px solid ${HAIRLINE}`,
                color: INK,
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Results */}
        <div
          style={{
            maxHeight: '50vh',
            overflowY: 'auto',
            borderTop: `0.5px solid ${HAIRLINE}`,
          }}
        >
          {debounced.trim().length === 0 ? (
            /* §5 NEW MESSAGE NO LONGER OPENS ONTO NOTHING. It opens on the
               golfers you have actually played with, most shared rounds first. */
            playedWith.isLoading ? (
              <div style={{ padding: '8px 16px' }}>
                {[0, 1, 2].map((i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                    <Skeleton style={{ width: 44, height: 44, borderRadius: 16 }} />
                    <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
                  </div>
                ))}
              </div>
            ) : playedWith.members.length === 0 ? (
              <div style={{ padding: '32px 16px', color: SUB, fontSize: 14, textAlign: 'center' }}>
                {t('search.prompt')}
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: '12px 16px 6px',
                    fontSize: 9.5,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: SUB,
                  }}
                >
                  {t('compose.playedWith', { defaultValue: 'Played with' })}
                </div>
                {playedWith.members.map((m) => {
                  const candidate: Candidate = {
                    actor_type: 'personal',
                    actor_id: m.userId,
                    name: m.name,
                    avatar_url: m.avatarUrl,
                    verified: m.verified,
                  };
                  const selectedRow = isSelected(candidate);
                  return (
                    <button
                      key={m.userId}
                      type="button"
                      onClick={() => toggleSelect(candidate)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                        padding: '12px 16px',
                        background: 'transparent',
                        border: 'none',
                        borderBottom: `0.5px solid ${HAIRLINE}`,
                        textAlign: 'left',
                      }}
                    >
                      <SquircleAvatar
                        src={m.avatarUrl ?? undefined}
                        userId={m.userId}
                        alt={m.name}
                        size={44}
                        hairlineRing
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            color: INK,
                            fontSize: 15,
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {m.name}
                        </div>
                        <div style={{ color: SUB, fontSize: 12, marginTop: 2 }}>
                          {t('compose.roundsTogether', {
                            count: m.sharedRounds,
                            defaultValue: `${m.sharedRounds} rounds together`,
                          })}
                        </div>
                      </div>
                      <div
                        aria-hidden
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          border: `1.5px solid ${selectedRow ? INK : 'rgba(0,0,0,0.18)'}`,
                          background: selectedRow ? INK : 'transparent',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#FFFFFF',
                        }}
                      >
                        {selectedRow && <Check size={14} strokeWidth={2.5} />}
                      </div>
                    </button>
                  );
                })}
              </>
            )

          ) : isLoading ? (
            <div style={{ padding: '8px 16px' }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
                  <Skeleton style={{ width: 44, height: 44, borderRadius: 16 }} />
                  <Skeleton style={{ flex: 1, height: 12, borderRadius: 4 }} />
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div style={{ padding: '32px 16px', color: SUB, fontSize: 14, textAlign: 'center' }}>
              {t('search.noResults')}
            </div>
          ) : (
            candidates.map((c) => {
              const permission = actor
                ? canActorMessage({ actorType: actor.actorType }, { actorType: c.actor_type })
                : { allowed: false as const, reason: 'Not signed in' };
              const disabled = !permission.allowed;
              const selectedRow = isSelected(c);
              return (
                <button
                  key={`${c.actor_type}:${c.actor_id}`}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && toggleSelect(c)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: `0.5px solid ${HAIRLINE}`,
                    textAlign: 'left',
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <SquircleAvatar src={c.avatar_url ?? undefined} alt={c.name} size={44} hairlineRing />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: INK,
                        fontSize: 15,
                        fontWeight: 500,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {c.name}
                    </div>
                    <div style={{ color: SUB, fontSize: 12, marginTop: 2 }}>
                      {c.actor_type === 'business'
                        ? 'Business'
                        : disabled
                        ? (permission as { allowed: false; reason: string }).reason
                        : 'Person'}
                    </div>
                  </div>
                  <div
                    aria-hidden
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 999,
                      border: `1.5px solid ${selectedRow ? INK : 'rgba(0,0,0,0.18)'}`,
                      background: selectedRow ? INK : 'transparent',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                    }}
                  >
                    {selectedRow && <Check size={14} strokeWidth={2.5} />}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 16px 4px',
            borderTop: `0.5px solid ${HAIRLINE}`,
          }}
        >
          <div style={{ flex: 1 }} />
          {selected.length <= 1 ? (
            <button
              type="button"
              disabled={selected.length !== 1 || busy}
              onClick={startDM}
              style={{
                background: INK,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                padding: '12px 16px',
                borderRadius: 999,
                border: 'none',
                opacity: selected.length !== 1 || busy ? 0.4 : 1,
              }}
            >
              {t('action.message')}
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={createGroup}
              style={{
                background: INK,
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 500,
                padding: '12px 16px',
                borderRadius: 999,
                border: 'none',
                opacity: busy ? 0.4 : 1,
              }}
            >
              {t('action.createGroup')}
            </button>
          )}
        </div>
      </div>
    </BottomSheet>
  );
};

export default NewConversationSheet;
