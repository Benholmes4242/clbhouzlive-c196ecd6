/**
 * BRIEF_PROFILE_ROUNDS_TAB — a member's round history on their profile.
 *
 * Missing data is ABSENT, never approximated:
 *  - course_par null  → no to-par figure and out of the to-par average; the
 *                       round still lists with its gross. The form strip is
 *                       differential-based, so par is not needed for it.
 *  - handicap_differential or handicap_index_at_time null → NO form value;
 *    the current index is never substituted for the index held at the time.
 *  - not a full eighteen (isFullEighteen, PersonalBestsSection's test) →
 *    listed and marked, but out of Best, Average, to-par and form.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { CHART } from '@/components/profile/handicap/whs/charts/tokens';
import { MEMBER_CELL } from '@/lib/tokens/surfaces';
import { formatDayMonthShortGB, formatNumber } from '@/i18n/format';
import { A, FIGS, SANS, toParParts } from '@/features/courses/components/holes/analytical/tokens';
import { ABOUT_KICKER } from '@/components/courses/course-detail/about/AboutSection';
import { YouFigure } from '@/components/courses/course-detail/you/youBits';
import { isFullEighteen, useOwnHandicapVisibility, useProfileRounds, type ProfileRound } from './useProfileRounds';

interface Props {
  userId: string;
  isOwnProfile: boolean;
  handicapIndex: number | null;
}

type Sort = 'recent' | 'lowest';
const FORM_N = 10;
const INITIAL_ROWS = 20;

function parseDate(v: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(v);
}

/**
 * Differential form: played-to (the stored handicap_differential) minus the
 * index the member held at the time. Par and course handicap are not part of
 * it. A round with no index on record has NO form value — the member's
 * current index is never substituted for the one they held.
 */
function formValue(r: ProfileRound): number | null {
  if (!isFullEighteen(r) || r.handicap_differential == null || r.handicap_index_at_time == null) {
    return null;
  }
  return Number(r.handicap_differential) - Number(r.handicap_index_at_time);
}

const fmt1 = (n: number) => n.toFixed(1);

/** The feed's RARE/NEW tag treatment, as a small pill. */
const FeatPill: React.FC<{ label: string }> = ({ label }) => (
  <span
    style={{
      fontFamily: SANS,
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.12em',
      lineHeight: 1,
      textTransform: 'uppercase',
      color: CHART.AMBER,
      border: `1px solid ${CHART.BORDER}`,
      borderRadius: 999,
      padding: '3px 6px',
      whiteSpace: 'nowrap',
    }}
  >
    {label}
  </span>
);

const ProfileRoundsTab: React.FC<Props> = ({ userId, isOwnProfile, handicapIndex }) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { data: rounds = [], isLoading } = useProfileRounds(userId);
  const { data: ownVisibility } = useOwnHandicapVisibility(userId, isOwnProfile);
  const [sort, setSort] = React.useState<Sort>('recent');
  const [showAll, setShowAll] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const stats = React.useMemo(() => {
    const full = rounds.filter(isFullEighteen);
    const grosses = full.map((r) => r.gross_score).filter((g): g is number => g != null);
    const best = grosses.length ? Math.min(...grosses) : null;
    const avg = grosses.length ? grosses.reduce((a, b) => a + b, 0) / grosses.length : null;
    const last = rounds.slice(0, FORM_N);
    const form = last
      .map((r) => ({ r, v: formValue(r) }))
      .filter((x): x is { r: ProfileRound; v: number } => x.v != null)
      .reverse(); // oldest left
    return { best, avg, form, lastCount: last.length };
  }, [rounds]);

  if (isLoading) {
    return <div style={{ height: 240 }} aria-busy="true" />;
  }

  if (rounds.length === 0) {
    if (!isOwnProfile) return null;
    return (
      <div style={{ padding: '24px 20px 32px', fontFamily: SANS }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: CHART.INK }}>
          {t('rounds.empty.title', 'No rounds yet')}
        </div>
        <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.55, color: CHART.MUTE }}>
          {t('rounds.empty.body', 'Connect your handicap record and every round you play will appear here.')}
        </p>
        <button
          type="button"
          onClick={() => navigate('/handicap')}
          style={{ marginTop: 14, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: CHART.INK }}
        >
          {t('rounds.empty.cta', 'Connect handicap record')} ›
        </button>
      </div>
    );
  }

  const isPrivateOwn = isOwnProfile && ownVisibility === 'private';
  const maxAbs = Math.max(1, ...stats.form.map((x) => Math.abs(x.v)));
  const HALF = 36;

  // Rows
  const sorted =
    sort === 'lowest'
      ? [...rounds].sort((a, b) => (a.gross_score ?? 999) - (b.gross_score ?? 999))
      : rounds;
  const visible = showAll ? sorted : sorted.slice(0, INITIAL_ROWS);

  const yearMeta = new Map<number, { n: number; avg: number | null }>();
  if (sort === 'recent') {
    const acc = new Map<number, number[]>();
    let count = new Map<number, number>();
    for (const r of rounds) {
      const y = parseDate(r.play_date).getFullYear();
      count.set(y, (count.get(y) ?? 0) + 1);
      if (r.gross_score != null && isFullEighteen(r)) acc.set(y, [...(acc.get(y) ?? []), r.gross_score]);
    }
    count.forEach((n, y) => {
      const g = acc.get(y) ?? [];
      yearMeta.set(y, { n, avg: g.length ? g.reduce((a, b) => a + b, 0) / g.length : null });
    });
    count = new Map();
  }

  const feats = (r: ProfileRound): string[] => {
    const out: string[] = [];
    const n = (v: number | null) => Number(v ?? 0);
    const lbl = (k: string, d: string, c: number) => (c > 1 ? `${c} ${t(k, d)}` : t(k, d));
    if (n(r.holes_in_one) > 0) out.push(lbl('rounds.feat.ace', 'Ace', n(r.holes_in_one)));
    if (n(r.albatrosses) > 0) out.push(lbl('rounds.feat.albatross', 'Albatross', n(r.albatrosses)));
    if (n(r.eagles) > 0) out.push(lbl('rounds.feat.eagle', 'Eagle', n(r.eagles)));
    if (r.clean_card) out.push(t('rounds.feat.cleanCard', 'Clean card'));
    return out;
  };

  let lastYear: number | null = null;

  return (
    <div style={{ padding: '8px 18px 32px', fontFamily: SANS }}>
      {isPrivateOwn ? (
        <div style={{ background: MEMBER_CELL, borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: CHART.INK }}>
            {t('rounds.private.title', 'Only you can see this')}
          </div>
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5, color: CHART.MUTE }}>
            {t('rounds.private.body', 'Your handicap is set to private. To share your rounds, change Handicap visibility in Edit profile.')}
          </div>
          <button
            type="button"
            onClick={() => navigate('/edit-profile')}
            style={{ marginTop: 8, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: CHART.INK }}
          >
            {t('rounds.private.cta', 'Privacy settings')} ›
          </button>
        </div>
      ) : null}

      {/* 1. STAT BAND */}
      <div style={{ display: 'flex', gap: 12 }}>
        <YouFigure label={t('rounds.stat.rounds', 'Rounds')} value={formatNumber(rounds.length)} />
        <YouFigure label={t('rounds.stat.best', 'Best')} value={stats.best != null ? String(stats.best) : '\u2014'} tone={A.AMBER} />
        <YouFigure label={t('rounds.stat.average', 'Average')} value={stats.avg != null ? fmt1(stats.avg) : '\u2014'} />
        <YouFigure label={t('rounds.stat.index', 'Index')} value={handicapIndex != null ? fmt1(handicapIndex) : '\u2014'} />
      </div>
      <p style={{ margin: '12px 0 0', fontSize: 12, lineHeight: 1.5, color: CHART.MUTE, ...FIGS }}>
        {stats.avgToPar != null
          ? t('rounds.context', '{{toPar}} to par on average, across {{courses}} courses', {
              toPar: signed(stats.avgToPar),
              courses: formatNumber(stats.courses),
            })
          : t('rounds.contextNoPar', 'Across {{courses}} courses', { courses: formatNumber(stats.courses) })}
      </p>

      {/* 2. RECENT FORM */}
      {stats.form.length > 0 ? (
        <section style={{ marginTop: 28 }}>
          <div style={{ ...ABOUT_KICKER }}>{t('rounds.form.title', 'Recent form against handicap')}</div>
          <div style={{ position: 'relative', height: HALF * 2, marginTop: 12, display: 'flex', gap: 6 }}>
            <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, top: HALF, height: 1, background: CHART.FAINT }} />
            {stats.form.map(({ r, v }) => {
              const px = Math.max(2, Math.round((Math.abs(v) / maxAbs) * (HALF - 2)));
              const worse = v > 0;
              return (
                <div key={r.whs_score_id} style={{ flex: 1, position: 'relative' }}>
                  <span
                    aria-hidden
                    style={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      top: worse ? HALF - px : HALF + 1,
                      height: px,
                      borderRadius: 2,
                      background: v === 0 ? CHART.FAINT : worse ? CHART.UP : CHART.DOWN,
                    }}
                  />
                </div>
              );
            })}
          </div>
          <p style={{ margin: '10px 0 0', fontSize: 12, color: CHART.MUTE, ...FIGS }}>
            {isOwnProfile
              ? t('rounds.form.beatOwn', 'Beat your handicap in {{n}} of the last {{m}}.', { n: stats.beat, m: stats.form.length })
              : t('rounds.form.beat', 'Beat their handicap in {{n}} of the last {{m}}.', { n: stats.beat, m: stats.form.length })}
          </p>
          {stats.form.length < stats.lastCount ? (
            <p style={{ margin: '4px 0 0', fontSize: 11, color: CHART.DIM, ...FIGS }}>
              {t('rounds.form.missing', '{{k}} of the last {{total}} are left out: nine holes, or no handicap index on record.', {
                k: stats.lastCount - stats.form.length,
                total: stats.lastCount,
              })}
            </p>
          ) : null}
        </section>
      ) : null}

      {/* 3. SORT */}
      <div role="tablist" style={{ display: 'flex', gap: 18, marginTop: 28 }}>
        {(['recent', 'lowest'] as Sort[]).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={sort === s}
            type="button"
            onClick={() => setSort(s)}
            style={{ padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 13, fontWeight: sort === s ? 700 : 600, color: sort === s ? CHART.INK : CHART.DIM }}
          >
            {s === 'recent' ? t('rounds.sort.recent', 'Recent') : t('rounds.sort.lowest', 'Lowest')}
          </button>
        ))}
      </div>

      {/* 4–5. YEAR GROUPS + ROWS */}
      <div style={{ marginTop: 8 }}>
        {visible.map((r) => {
          const y = parseDate(r.play_date).getFullYear();
          const header = sort === 'recent' && y !== lastYear;
          lastYear = y;
          const meta = yearMeta.get(y);
          const full18 = isFullEighteen(r);
          const toPar = full18 && r.gross_score != null && r.course_par != null ? r.gross_score - r.course_par : null;
          const parts = toPar != null ? toParParts(toPar, 0) : null;
          const isBest = full18 && stats.best != null && r.gross_score === stats.best;
          const fs = feats(r);
          return (
            <React.Fragment key={r.whs_score_id}>
              {header && meta ? (
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '20px 0 8px', borderBottom: `1px solid ${CHART.BORDER}` }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: CHART.INK, ...FIGS }}>{y}</span>
                  <span style={{ ...ABOUT_KICKER, ...FIGS }}>
                    {t('rounds.yearMeta', { count: meta.n, n: formatNumber(meta.n), avg: meta.avg != null ? fmt1(meta.avg) : '\u2014', defaultValue: '{{n}} rounds · avg {{avg}}' })}
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={() => setOpenId(r.whs_score_id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderBottom: `1px solid ${CHART.BORDER}`, padding: '11px 0', cursor: 'pointer', fontFamily: SANS }}
              >
                <span style={{ width: 52, flexShrink: 0, fontSize: 12, fontWeight: 600, color: CHART.MUTE, ...FIGS }}>
                  {formatDayMonthShortGB(parseDate(r.play_date))}
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: CHART.INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.course_name ?? '\u2014'}
                  </span>
                  {fs.length || !full18 ? (
                    <span style={{ display: 'flex', gap: 4, marginTop: 5, flexWrap: 'wrap' }}>
                      {!full18 ? (
                        <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', lineHeight: 1, textTransform: 'uppercase', color: CHART.MUTE, border: `1px solid ${CHART.BORDER}`, borderRadius: 999, padding: '3px 6px', whiteSpace: 'nowrap' }}>
                          {r.whs_joined && r.is_nine_hole ? t('rounds.nineHoles', '9 holes') : t('rounds.notFull', 'Not a full 18')}
                        </span>
                      ) : null}
                      {fs.map((f) => <FeatPill key={f} label={f} />)}
                    </span>
                  ) : null}
                </span>
                <span style={{ width: 34, textAlign: 'right', fontSize: 16, fontWeight: 700, color: isBest ? CHART.AMBER : CHART.INK, ...FIGS }}>
                  {r.gross_score ?? '\u2014'}
                </span>
                <span style={{ width: 34, textAlign: 'right', fontSize: 13, fontWeight: 700, color: parts?.tone ?? CHART.MUTE, ...FIGS }}>
                  {parts?.text ?? ''}
                </span>
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* 6. ALL N ROUNDS */}
      {!showAll && sorted.length > INITIAL_ROWS ? (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          style={{ display: 'block', marginTop: 16, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: '0.11em', textTransform: 'uppercase', color: CHART.MUTE }}
        >
          {t('rounds.all', { count: rounds.length, n: formatNumber(rounds.length), defaultValue: 'All {{n}} rounds' })} ›
        </button>
      ) : null}

      <RoundDetailSheet open={openId != null} onClose={() => setOpenId(null)} scoreId={openId} profileUserId={userId} />
    </div>
  );
};

export default ProfileRoundsTab;
