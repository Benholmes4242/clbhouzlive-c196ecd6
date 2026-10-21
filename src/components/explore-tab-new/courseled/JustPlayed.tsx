import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section, SeeAll } from '@/features/explore-magazine/Section';

import { FIGS } from './tokens';
import { windowOption, type BoardFilters } from './boardFilters';
import { useBoardPage, type BoardRow } from './hooks/useBoardPage';
import { BoardSeeAllSheet } from './BoardSeeAllSheet';
import { describeFilterParts } from './describeFilters';
import { BoardHeaderRow, BoardRowView } from './BoardRows';
import { useHeldFrame } from './useHeldFrame';
import { HeldRows } from './HeldRows';

/** EX1: the existing recent board rendered plainly. NOT deduped by design —
 * one member may appear twice, correct for a feed. No new RPC: a second read
 * would be a second answer to the question the recent board already answers.
 * "See all rounds" pages the SAME call (BoardSeeAllSheet on 'recent'), so the
 * section and the sheet cannot disagree about what is newest. Absent while
 * unsettled and when empty — no kicker, no skeleton, no empty state. */
const LIMIT = 5;

export function JustPlayed({
  viewerId,
  filters,
  enabled,
  onRowPress,
}: {
  viewerId: string | undefined;
  filters: BoardFilters;
  enabled: boolean;
  onRowPress: (row: BoardRow) => void;
}) {
  const { t } = useTranslation('courses');
  const page = useBoardPage(viewerId, 'recent', filters, { limit: LIMIT, enabled });
  const [sheet, setSheet] = useState(false);
  const rows = page.isSuccess ? page.data?.rows ?? [] : [];
  // CB28: hold the frame between two populated states; absent otherwise.
  const frame = useHeldFrame({ active: enabled && page.isSuccess, pending: enabled && page.isPending, count: rows.length });
  if (frame.mode === 'none') return null;

  const win = windowOption(filters.window);

  return (
    <div data-just-played-section style={{ ...FIGS }}>
    <Section
      contest
      eyebrow={t('amateur.justPlayed.eyebrow', { defaultValue: 'The latest' })}
      title={t('amateur.justPlayed.title', { defaultValue: 'Just played' })}
      meta={t(win.i18n, win.label)}
    >
      <BoardHeaderRow board="recent" flush />
      {frame.mode === 'hold' ? <HeldRows count={frame.heldCount} rowHeight={frame.rowHeight} /> : <div ref={frame.bodyRef}>
        {rows.map((r) => <BoardRowView key={`${r.pos}:${r.whs_score_id ?? r.user_id}`} row={r} board="recent" isSelf={!!viewerId && r.user_id === viewerId} onPress={onRowPress} flush />)}
      </div>}
      <SeeAll label={t('amateur.leaderboards.seeAllRounds')} onPress={() => setSheet(true)} />
      {sheet ? (
        <BoardSeeAllSheet
          open
          onClose={() => setSheet(false)}
          userId={viewerId}
          board="recent"
          filters={filters}
          appliedParts={describeFilterParts(filters, t as never)}
          title={t('amateur.justPlayed.sheetTitle')}
          onRowPress={onRowPress}
        />
      ) : null}
    </Section>
    </div>
  );
}
