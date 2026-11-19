import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useScorecardOpener } from '@/components/explore-tab-new/useScorecardOpener';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { boldParts, fillTemplate } from './latelyRules';
import AboutSection, { GUTTER } from './AboutSection';
import { useCourseHonours } from './useCourseHonours';
import { type CourseHonour, holeOrdinal, honourDate, honourPages } from './honoursRules';
import './course-honours.css';

/**
 * THE HONOURS BOARD — after Lately here. One read (useCourseHonours); nothing
 * renders signed out, pending, errored or empty (no skeleton). Holes in one,
 * then albatrosses, four rows a page in a snap-scrolling pager. A row opens
 * the round in the same RoundDetailSheet Lately uses.
 */
const CourseHonoursSection: React.FC<{ courseId: string; userId: string | undefined }> = ({ courseId, userId }) => {
  const { t } = useTranslation('courses');
  const q = useCourseHonours(courseId, userId);
  const opener = useScorecardOpener();

  useEffect(() => {
    if (q.isError) console.warn('[course honours] read failed; section hidden');
  }, [q.isError]);

  if (!userId || q.isPending || q.isError) return null;
  const rows = q.data ?? [];
  if (rows.length === 0) return null;
  const aces = rows.filter((r) => r.kind === 'ace');
  const albatrosses = rows.filter((r) => r.kind === 'albatross');

  return (
    <div data-course-honours="ready">
      <AboutSection kicker={t('courseDetail.honours.kicker', 'HONOURS')} title={t('courseDetail.honours.title', 'The honours board')} bleed>
        <p data-course-honours-lede style={{ margin: '-6px 0 0', padding: `0 ${GUTTER}px`, fontSize: 13.5, color: A.MUTE, lineHeight: 1.45, fontFamily: SANS }}>
          {t('courseDetail.honours.lede', 'Every hole-in-one and albatross a member has recorded here.')}
        </p>
        {aces.length > 0 ? (
          <HonoursGroup kind="ace" label={t('courseDetail.honours.aces', 'HOLES IN ONE')} rows={aces} onOpen={(r) => opener.openByScore(r.whs_score_id, null, r.user_id)} />
        ) : null}
        {albatrosses.length > 0 ? (
          <HonoursGroup kind="albatross" label={t('courseDetail.honours.albatrosses', 'ALBATROSSES')} rows={albatrosses} onOpen={(r) => opener.openByScore(r.whs_score_id, null, r.user_id)} />
        ) : null}
      </AboutSection>
      <RoundDetailSheet
        open={opener.target != null}
        onClose={opener.close}
        scoreId={opener.target?.scoreId ?? null}
        profileUserId={opener.target?.profileUserId ?? null}
      />
    </div>
  );
};

function HonoursGroup({ kind, label, rows, onOpen }: { kind: CourseHonour['kind']; label: string; rows: CourseHonour[]; onOpen: (r: CourseHonour) => void }) {
  const { t } = useTranslation('courses');
  const pages = honourPages(rows);
  const [page, setPage] = useState(0);
  const paged = pages.length > 1;
  return (
    <div data-honours-group={kind} className="honours-group">
      <div className="honours-head">
        <span>{label} · <b data-honours-count>{rows.length}</b></span>
        {paged ? (
          <span data-honours-position className="honours-pos">
            {fillTemplate(t('courseDetail.honours.pageOf', { k: page + 1, pages: pages.length, defaultValue: '{{k}} of {{pages}}' }) as string, { k: page + 1, pages: pages.length })}
          </span>
        ) : null}
      </div>
      <div
        data-honours-pages
        className="honours-pages"
        onScroll={(event) => {
          const el = event.currentTarget;
          if (!el.clientWidth) return;
          const k = Math.max(0, Math.min(pages.length - 1, Math.round(el.scrollLeft / el.clientWidth)));
          if (k !== page) setPage(k);
        }}
      >
        {pages.map((p, i) => (
          <div key={i} data-honours-page className="honours-page">
            {p.map((r) => <HonourRow key={`${r.kind}:${r.whs_score_id}:${r.hole_no}`} row={r} onOpen={onOpen} />)}
          </div>
        ))}
      </div>
      {paged ? (
        <div data-honours-dots className="honours-dots" aria-hidden>
          {pages.map((_, i) => <i key={i} data-on={i === page ? 'true' : undefined} />)}
        </div>
      ) : null}
    </div>
  );
}

function HonourRow({ row, onOpen }: { row: CourseHonour; onOpen: (r: CourseHonour) => void }) {
  const { t, i18n } = useTranslation('courses');
  const ord = holeOrdinal(row.hole_no);
  const lead = row.kind === 'ace'
    ? { key: 'courseDetail.honours.aceSub', def: '<b>{{hole}}</b>', v: { hole: ord } }
    : { key: 'courseDetail.honours.albatrossSub', def: '<b>{{strokes}} on the {{hole}}</b>', v: { hole: ord, strokes: row.strokes } };
  const leadText = fillTemplate(t(lead.key, { ...lead.v, defaultValue: lead.def }) as string, lead.v);
  const yards = row.yards != null ? ` · ${fillTemplate(t('courseDetail.honours.yards', { n: row.yards, defaultValue: '{{n}} yds' }) as string, { n: row.yards })}` : '';
  const par = row.kind === 'ace' ? ` · ${fillTemplate(t('courseDetail.honours.par', { n: row.par, defaultValue: 'par {{n}}' }) as string, { n: row.par })}` : '';
  return (
    <button type="button" data-honour-row={row.kind} className="honours-row" onClick={() => onOpen(row)}>
      <span data-honour-mark className="honours-mark">{row.strokes}</span>
      <span className="honours-nm">
        <span className="honours-name">{row.display_name}</span>
        <span data-honour-sub className="honours-sub">
          {boldParts(leadText).map((p, i) => (p.bold ? <em key={i}>{p.text}</em> : <span key={i}>{p.text}</span>))}
          {yards}{par}
        </span>
      </span>
      <span className="honours-dt">
        {honourDate(row.play_date, i18n.language || 'en')}
        {row.is_competition ? <small data-honour-competition>{t('courseDetail.honours.competition', 'COMPETITION')}</small> : null}
      </span>
    </button>
  );
}

export default CourseHonoursSection;
