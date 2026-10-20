import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Section } from '@/features/explore-magazine/Section';

import { A, FIGS, SANS } from './tokens';
import { BOARD_LABELS, windowOption, type BoardFilters } from './boardFilters';
import { useBoardPage, type BoardRow } from './hooks/useBoardPage';
import { BoardSeeAllSheet } from './BoardSeeAllSheet';
import { describeFilterParts } from './describeFilters';
import { playDateAtLocalNoon } from './discoverWhen';
import { MemberAvatar } from './MemberAvatar';

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
  const { t, i18n } = useTranslation('courses');
  const page = useBoardPage(viewerId, 'recent', filters, { limit: LIMIT, enabled });
  const [sheet, setSheet] = useState(false);
  const rows = page.data?.rows ?? [];
  if (!enabled || !page.isSuccess || rows.length === 0) return null;

  const win = windowOption(filters.window);
  const dateOf = (s: string) => {
    const d = playDateAtLocalNoon(s);
    return d ? `${d.getDate()} ${d.toLocaleDateString(i18n?.language, { month: 'short' })}` : '';
  };

  return (
    <div data-just-played-section style={{ ...FIGS }}>
    <Section
      contest
      eyebrow={t('amateur.justPlayed.eyebrow', { defaultValue: 'The latest' })}
      title={t('amateur.justPlayed.title', { defaultValue: 'Just played' })}
      meta={t(win.i18n, win.label)}
    >
      {rows.map((r) => (
        <button
          key={`${r.pos}:${r.whs_score_id ?? r.user_id}`}
          type="button"
          data-just-played-row
          onClick={() => onRowPress(r)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 0',
            borderBottom: `1px solid ${A.SOFT}`, lineHeight: 1.25,
            background: 'none', borderTop: 0, borderLeft: 0, borderRight: 0, textAlign: 'left',
            fontFamily: SANS, cursor: 'pointer',
          }}
        >
          <span style={{ flex: 'none', display: 'flex' }}>
            <MemberAvatar userId={r.user_id} name={r.display_name} photoUrl={r.profile_photo_url} size={24} />
          </span>
          <span style={{ fontSize: 12.5, fontWeight: 700, color: A.BODY, whiteSpace: 'nowrap' }}>
            {r.display_name || t('discover.aMember')}
          </span>
          <span style={{ flex: 1, minWidth: 0, fontSize: 10.5, fontWeight: 600, color: A.DIM, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {`${r.course_name ?? t('discover.unknownCourse')} \u00b7 ${dateOf(r.play_date)}`}
          </span>
          <span className="tabular-nums" style={{ flex: 'none', textAlign: 'right', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: A.INK }}>{r.net_score ?? '\u2014'}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: A.FAINT, marginLeft: 5 }}>{r.gross_score ?? '\u2014'}</span>
          </span>
        </button>
      ))}
      <button
        type="button"
        data-just-played-see-all
        onClick={() => setSheet(true)}
        style={{
          display: 'block', margin: '15px auto 0', padding: 0, background: 'none', border: 0, cursor: 'pointer',
          fontFamily: SANS, fontSize: 11.5, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase',
          color: A.INK, lineHeight: 1.25,
        }}
      >
        {t('amateur.leaderboards.seeAllRounds')} ›
      </button>
      {sheet ? (
        <BoardSeeAllSheet
          open
          onClose={() => setSheet(false)}
          userId={viewerId}
          board="recent"
          filters={filters}
          appliedParts={describeFilterParts(filters, t as never)}
          title={t(BOARD_LABELS.recent.i18n)}
          onRowPress={onRowPress}
        />
      ) : null}
    </Section>
    </div>
  );
}
