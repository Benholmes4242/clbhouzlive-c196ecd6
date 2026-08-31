/**
 * BRIEF_SUGGESTED_GOLFERS S3.2 - the after-a-round prompt. Shows the member's
 * newest synced round, says nobody saw it, and offers four reason-led
 * suggestions with a Not now dismissal.
 *
 * S4.3 - it shows ONCE PER ROUND at most, and not at all if dismissed in the
 * last seven days. Both facts live in localStorage; nothing is notified and
 * nothing is written server-side.
 */
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { ROW_FONT } from '@/features/social-lists-v2/rowParts';
import { SuggestedGolferRow } from './SuggestedGolferRow';
import { useSuggestedGolfers, useSuggestionGate } from './useSuggestedGolfers';

const SEEN_KEY = 'clbhouz.suggest.roundPrompt.seen';
const DISMISS_KEY = 'clbhouz.suggest.roundPrompt.dismissedAt';
const DISMISS_DAYS = 7;
/** A round older than this is no longer "just played". */
const ROUND_WINDOW_DAYS = 3;

function readSeen(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}

function dismissedRecently(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const at = Number(raw);
    if (!Number.isFinite(at)) return false;
    return Date.now() - at < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

interface LatestRound {
  whs_score_id: string;
  course_name: string | null;
  play_date: string | null;
  gross_score: number | null;
}

function useLatestRound(enabled: boolean) {
  const { user } = useSupabaseSession();
  return useQuery({
    queryKey: ['suggest-latest-round', user?.id ?? null],
    enabled: !!user?.id && enabled,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const since = new Date(Date.now() - ROUND_WINDOW_DAYS * 86_400_000)
        .toISOString()
        .slice(0, 10);
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select('whs_score_id, course_name, play_date, gross_score')
        .eq('user_id', user!.id)
        .gte('play_date', since)
        .order('play_date', { ascending: false })
        .limit(1);
      if (error) throw error;
      return ((data ?? [])[0] ?? null) as LatestRound | null;
    },
  });
}

export function NobodySawThatRound() {
  const { t } = useTranslation('common');
  const gate = useSuggestionGate();
  const [dismissed, setDismissed] = useState(false);

  const blocked = useMemo(() => dismissedRecently(), []);
  const seen = useMemo(() => readSeen(), []);

  const roundQ = useLatestRound(gate.eligible && !blocked);
  const round = roundQ.data ?? null;
  const alreadyShown = !!round && seen === round.whs_score_id;

  const showable = gate.eligible && !blocked && !dismissed && !!round && !alreadyShown;
  const suggestions = useSuggestedGolfers(4, showable);
  const people = (suggestions.data ?? []).slice(0, 4);

  if (!showable || people.length === 0) return null;

  // Once the prompt is on screen it has been shown for this round.
  try {
    window.localStorage.setItem(SEEN_KEY, round!.whs_score_id);
  } catch {
    /* private mode - the prompt may reappear next visit, which is acceptable */
  }

  const onNotNow = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* noop */
    }
    setDismissed(true);
  };

  const roundLine = [round!.course_name, round!.gross_score ? String(round!.gross_score) : null]
    .filter(Boolean)
    .join(' \u00b7 ');

  return (
    <section
      style={{
        fontFamily: ROW_FONT,
        margin: '12px 14px',
        background: A.PANEL,
        border: `0.5px solid ${A.BORDER}`,
        borderRadius: 14,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '14px 16px 10px' }}>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: A.DIM,
            fontVariantNumeric: 'tabular-nums lining-nums',
          }}
        >
          {roundLine}
        </div>
        <div style={{ marginTop: 6, fontSize: 17, fontWeight: 700, color: A.INK }}>
          {t('suggestedGolfers.prompt.title')}
        </div>
        <div style={{ marginTop: 4, fontSize: 13, fontWeight: 500, color: A.DIM, lineHeight: 1.4 }}>
          {t('suggestedGolfers.prompt.sub')}
        </div>
      </div>
      <div>
        {people.map((g, i) => (
          <SuggestedGolferRow key={g.user_id} golfer={g} showDivider={i < people.length - 1} />
        ))}
      </div>
      <div style={{ padding: '10px 16px 14px' }}>
        <button
          type="button"
          onClick={onNotNow}
          style={{
            background: 'transparent',
            border: `1px solid ${A.BORDER}`,
            borderRadius: 999,
            padding: '7px 14px',
            fontSize: 12.5,
            fontWeight: 700,
            color: A.DIM,
            fontFamily: ROW_FONT,
            cursor: 'pointer',
          }}
        >
          {t('suggestedGolfers.prompt.notNow')}
        </button>
      </div>
    </section>
  );
}

export default NobodySawThatRound;
