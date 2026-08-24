/**
 * ADDENDUM TO BRIEF_MESSAGES_DARK — THE COMPOSE SHEET.
 *
 * §1.1 IT WAS LIGHT. A white sheet rising over #05070A was the one transition
 *      inside Messages nobody chose. It is dark now, and it sits A STEP LIGHTER
 *      than the canvas (EC.PANEL over MSG.BLACK) so it reads as a layer above
 *      rather than the same plane.
 *
 * §1.2 THE CONTEXT LINE IS WHERE AND WHEN, NEVER A COUNT. Shared-round counts
 *      are PAIRING-BASED and not deduped (a day where both players post two
 *      rounds counts four), and on a compose sheet recency is the useful fact
 *      anyway: "who did I just play with", not "who have I played most". The
 *      course and date come from the SAME cache the thread strip already fills
 *      (['whs-shared-rounds', ...]) — no new shape of query.
 *
 * §3.1 A ROW WITH NO CONTEXT CARRIES NO LINE. Never a dash, never a
 *      placeholder, never a fabricated course.
 * §3.2 SELECTION IS VISIBLE ON THE WHOLE ROW — the row lifts to the panel tone
 *      and the tick fills.
 * §4   THE ACTION IS WHITE WHEN ENABLED, and the footer says what is selected,
 *      naming a GROUP before it is created.
 * §6   NO AMBER ANYWHERE. Everyone on this sheet is someone else.
 *
 * Unchanged: multi-select behaviour, msg_start_direct / msg_create_group, the
 * search query and its ranking/debounce, the token module, the typeface.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { X, Check } from 'lucide-react';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SheetHeader } from '@/components/ui/SheetHeader';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import {
  useEntityPickerSearch,
  type PersonResult,
  type BusinessResult,
} from '@/features/search-v2/hooks/useEntityPickerSearch';
import { useMessagingActor } from '@/hooks/messaging/useMessagingActor';
import { usePlayedWith } from '@/hooks/messaging/usePlayedWith';
import { useSharedGroundBatch } from '@/hooks/messaging/useSharedGround';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { canActorMessage } from '@/hooks/messaging/canActorMessage';
import { supabase } from '@/integrations/supabase/client';
import { MSG, MT } from '@/features/messaging-dark/tokens';
import { EC } from '@/features/echo-chat/tokens';
import type { Json } from '@/integrations/supabase/types';

/** §2 the sheet's own surface — one step lighter than the canvas behind it. */
const SHEET = EC.PANEL;
/** The lifted tone: a selected row, the search field, the disabled action. */
const RAISED = EC.RAISED;

/** How many played-with rows may fetch their course/date. */
const CONTEXT_CAP = 8;

type Candidate = {
  actor_type: 'personal' | 'business';
  actor_id: string;
  name: string;
  avatar_url: string | null;
  verified?: boolean;
};

/** "Broadstone · 12 Aug" — or nothing at all (§3.1). */
function formatWhen(dateISO: string | null): string | null {
  if (!dateISO) return null;
  const d = new Date(dateISO);
  if (Number.isNaN(d.getTime())) return null;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return d.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(sameYear ? {} : { year: 'numeric' }),
  });
}

const RowSkeleton: React.FC = () => (
  <div style={{ padding: '0 16px' }}>
    {[0, 1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 0',
          borderBottom: `0.5px solid ${MSG.RULE}`,
        }}
      >
        <div style={{ width: 42, height: 42, borderRadius: '34%', background: 'rgba(255,255,255,0.07)' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
          <div style={{ height: 10, width: '40%', borderRadius: 3, background: 'rgba(255,255,255,0.09)' }} />
          <div style={{ height: 9, width: '58%', borderRadius: 3, background: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>
    ))}
  </div>
);

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

  const { user } = useSupabaseSession();
  const playedWith = usePlayedWith(user?.id, open);

  // Where and when, from the thread strip's own cache keys.
  const playedIds = useMemo(
    () => playedWith.members.slice(0, CONTEXT_CAP).map((m) => m.userId),
    [playedWith.members],
  );
  const { byUserId } = useSharedGroundBatch(user?.id, playedIds, CONTEXT_CAP);

  /** §3.1 course and date if we hold it, else nothing. Never a count. */
  const contextFor = useCallback(
    (userId: string): string | null => {
      const g = byUserId[userId];
      if (!g?.lastCourseName) return null;
      const when = formatWhen(g.lastPlayDate);
      return when ? `${g.lastCourseName} · ${when}` : g.lastCourseName;
    },
    [byUserId],
  );

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

  /** §4 the footer states the selection, and names a group before it exists. */
  const footerLabel =
    selected.length === 0
      ? t('compose.chooseSomeone', { defaultValue: 'Choose someone' })
      : selected.length === 1
      ? t('compose.oneSelected', { defaultValue: '1 selected' })
      : selected.length === 2
      ? t('compose.nSelected', {
          count: selected.length,
          defaultValue: `${selected.length} selected`,
        })
      : t('compose.nSelectedGroup', {
          count: selected.length,
          defaultValue: `${selected.length} selected · group`,
        });

  const actionEnabled = selected.length >= 1 && !busy;

  /** One row shape for both the default set and the search results (§5.4). */
  const renderRow = (
    c: Candidate,
    context: string | null,
    opts: { disabled?: boolean; userId?: string } = {},
  ) => {
    const selectedRow = isSelected(c);
    const disabled = !!opts.disabled;
    return (
      <button
        key={`${c.actor_type}:${c.actor_id}`}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && toggleSelect(c)}
        className="active:opacity-80"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          padding: '11px 16px',
          // §3.2 the whole row lifts when selected.
          background: selectedRow ? RAISED : 'transparent',
          border: 'none',
          borderBottom: `0.5px solid ${MSG.RULE}`,
          textAlign: 'left',
          opacity: disabled ? 0.45 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      >
        <SquircleAvatar
          src={c.avatar_url ?? undefined}
          userId={opts.userId}
          alt={c.name}
          size={42}
          hairlineRing
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              ...MT.NAME,
              fontWeight: 700,
              color: MSG.INK,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {c.name}
          </div>
          {/* §3.1 no context, no line. */}
          {context && (
            <div
              style={{
                ...MT.CONTEXT,
                marginTop: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {context}
            </div>
          )}
        </div>
        <div
          aria-hidden
          style={{
            flexShrink: 0,
            width: 22,
            height: 22,
            borderRadius: 999,
            border: `1.5px solid ${selectedRow ? '#FFFFFF' : MSG.EDGE}`,
            background: selectedRow ? '#FFFFFF' : 'transparent',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: MSG.BLACK,
          }}
        >
          {selectedRow && <Check size={14} strokeWidth={2.5} />}
        </div>
      </button>
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      zIndexBase={1400}
      variant="dark"
      surfaceColor={SHEET}
    >
      <SheetHeader title={t('action.newMessage')} onClose={handleClose} dark />

      <div style={{ background: SHEET, paddingBottom: 4 }}>
        {/* Selected chips */}
        {selected.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', padding: '12px 16px 0' }}>
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
                  background: RAISED,
                  border: `0.5px solid ${MSG.EDGE}`,
                  borderRadius: 999,
                  color: MSG.INK,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <SquircleAvatar src={s.avatar_url ?? undefined} alt={s.name} size={20} hairlineRing />
                <span>{s.name}</span>
                <X size={14} color={MSG.INK_3} />
              </button>
            ))}
          </div>
        )}

        {/* Search field */}
        <div style={{ padding: '12px 16px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.people')}
            /* FIELD CANON (lib/tokens/field.ts). Was RAISED (#181F28, an opaque
               panel) with a 0.5px EDGE hairline. Height is padding-derived
               (~46px); stands alone. */
            className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
            style={{
              width: '100%',
              padding: '12px 14px',
              color: MSG.INK,
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
              /* FIELD CANON (lib/tokens/field.ts) — group-title field, same
                 construction as the people search above it. */
              className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS}`}
              style={{
                width: '100%',
                padding: '12px 14px',
                color: MSG.INK,
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>
        )}

        {/* Results */}
        <div
          style={{
            maxHeight: '50dvh',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            borderTop: `0.5px solid ${MSG.RULE}`,
          }}
        >
          {debounced.trim().length === 0 ? (
            /* §5.1 DEFAULT — the played-with set, most recent first. */
            playedWith.isLoading ? (
              <RowSkeleton />
            ) : playedWith.members.length === 0 ? (
              <div style={{ padding: '28px 16px', ...MT.PREVIEW, color: MSG.INK_3, textAlign: 'center' }}>
                {t('search.prompt')}
              </div>
            ) : (
              <>
                <div style={{ ...MT.EYEBROW, padding: '12px 16px 6px' }}>
                  {t('compose.playedWith', { defaultValue: 'Played with' })}
                </div>
                {playedWith.members.map((m) =>
                  renderRow(
                    {
                      actor_type: 'personal',
                      actor_id: m.userId,
                      name: m.name,
                      avatar_url: m.avatarUrl,
                      verified: m.verified,
                    },
                    contextFor(m.userId),
                    { userId: m.userId },
                  ),
                )}
              </>
            )
          ) : isLoading ? (
            <RowSkeleton />
          ) : candidates.length === 0 ? (
            /* §5.5 NO RESULTS — one line, one suggestion, no illustration. */
            <div style={{ padding: '28px 16px' }}>
              <div style={{ ...MT.NAME, fontWeight: 700, color: MSG.INK }}>
                {t('search.noResults')}
              </div>
              <div style={{ ...MT.PREVIEW, color: MSG.INK_3, marginTop: 6 }}>
                {t('search.noResultsHint', {
                  defaultValue: 'Try a full name or a username.',
                })}
              </div>
            </div>
          ) : (
            /* §5.4 SEARCHING — the same row shape and the same context line. */
            candidates.map((c) => {
              const permission = actor
                ? canActorMessage({ actorType: actor.actorType }, { actorType: c.actor_type })
                : { allowed: false as const, reason: 'Not signed in' };
              const disabled = !permission.allowed;
              const context = disabled
                ? (permission as { allowed: false; reason: string }).reason
                : c.actor_type === 'business'
                ? t('context.business')
                : contextFor(c.actor_id);
              return renderRow(c, context, {
                disabled,
                userId: c.actor_type === 'personal' ? c.actor_id : undefined,
              });
            })
          )}
        </div>

        {/* §4 the footer states the selection; the action is WHITE when enabled */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 16px 4px',
            borderTop: `0.5px solid ${MSG.RULE}`,
          }}
        >
          <div style={{ ...MT.CONTEXT, flex: 1, minWidth: 0 }}>{footerLabel}</div>
          <button
            type="button"
            disabled={!actionEnabled}
            onClick={selected.length >= 2 ? createGroup : startDM}
            className="active:opacity-80"
            style={{
              flexShrink: 0,
              background: actionEnabled ? '#FFFFFF' : RAISED,
              color: actionEnabled ? MSG.BLACK : MSG.INK_3,
              border: actionEnabled ? 'none' : `0.5px solid ${MSG.EDGE}`,
              fontSize: 14,
              fontWeight: 700,
              padding: '11px 18px',
              borderRadius: 999,
            }}
          >
            {selected.length >= 2 ? t('action.createGroup') : t('action.message')}
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};

export default NewConversationSheet;
