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
import SeasonSection from './sections/SeasonSection';
import YearSection from './sections/YearSection';
import CoursesPlayedSection from './sections/CoursesPlayedSection';
import { courseStats, parsePlayDate } from './roundsDerivations';
import { KICKER, RT, TAB, TITLE } from './sections/roundsTokens';
import { A, FIGS, SANS } from '@/features/courses/components/holes/analytical/tokens';
import RailChips from '@/components/ui/RailChips';
import { CAPS, FeatPill, Pill, roundFeats, vsHandicapLabel } from '@/features/explore-magazine/AchievementCallout';
import { handicapPairDisplay } from '@/features/explore-magazine/circleHandicap';
import { toParLabel } from '@/features/explore-magazine/exploreCopy';
import { AwardCluster } from '@/features/explore-magazine/AwardCluster';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
const medalTotal = (r: ProfileRound) => (r.medals_gold ?? 0) + (r.medals_silver ?? 0) + (r.medals_bronze ?? 0);
import { isFullEighteen, useOwnHandicapVisibility, useProfileRounds, type ProfileRound } from './useProfileRounds';

interface Props {
  userId: string;
  isOwnProfile: boolean;
  viewerId?: string;
  ownerFirstName?: string | null;
}

type Sort = 'recent' | 'lowest' | 'course';
const INITIAL_ROWS = 20;
const COL = { gross: 46, net: 34, vs: 34, index: 44 } as const;

const byDateDesc = (a: ProfileRound, b: ProfileRound) =>
  parsePlayDate(b.play_date).getTime() - parsePlayDate(a.play_date).getTime();

const DIVIDER: React.CSSProperties = {
  display: 'flex', alignItems: 'baseline', padding: '20px 0 8px',
};
const DIVIDER_TITLE: React.CSSProperties = { fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: RT.INK, ...TAB };

type Item = { kind: 'head'; key: string; title: string } | { kind: 'row'; r: ProfileRound };

const ProfileRoundsTab: React.FC<Props> = ({ userId, isOwnProfile, viewerId, ownerFirstName = null }) => {
  const { t } = useTranslation('profile');
  const navigate = useNavigate();
  const { data: rounds = [], isLoading } = useProfileRounds(userId);
  const { data: ownVisibility } = useOwnHandicapVisibility(userId, isOwnProfile);
  const [sort, setSort] = React.useState<Sort>('recent');
  const [showAll, setShowAll] = React.useState(false);
  const [openId, setOpenId] = React.useState<string | null>(null);

  // Derivation only (5.14 tint) — never rendered as a figure of its own.
  const stats = React.useMemo(() => {
    const grosses = rounds.filter(isFullEighteen).map((r) => r.gross_score).filter((g): g is number => g != null);
    return { best: grosses.length ? Math.min(...grosses) : null };
  }, [rounds]);

  const today = React.useMemo(() => new Date(), []);
  const year = today.getFullYear();

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

  // 5.3 / 5.4 / 5.5 — every order is set by the client.
  let ordered: ProfileRound[];
  if (sort === 'lowest') {
    ordered = rounds.filter((r) => isFullEighteen(r) && r.gross_score != null)
      .sort((a, b) => (a.gross_score as number) - (b.gross_score as number) || byDateDesc(a, b));
  } else if (sort === 'course') {
    const rank = new Map(courseStats(rounds).map((c, i) => [c.key, i]));
    const keyOf = (r: ProfileRound) => r.course_id || `name:${r.course_name ?? 'unknown'}`;
    ordered = [...rounds].sort((a, b) =>
      (rank.get(keyOf(a)) ?? Infinity) - (rank.get(keyOf(b)) ?? Infinity)
      || keyOf(a).localeCompare(keyOf(b)) || byDateDesc(a, b));
  } else {
    ordered = [...rounds].sort(byDateDesc);
  }
  const visible = showAll ? ordered : ordered.slice(0, INITIAL_ROWS);

  const items: Item[] = [];
  let lastKey: string | null = null;
  for (const r of visible) {
    if (sort === 'recent') {
      const y = parsePlayDate(r.play_date).getFullYear();
      if (String(y) !== lastKey) {
        items.push({ kind: 'head', key: `y${y}`, title: String(y) });
        lastKey = String(y);
      }
    } else if (sort === 'course') {
      const k = r.course_id || `name:${r.course_name ?? 'unknown'}`;
      if (k !== lastKey) {
        items.push({ kind: 'head', key: `c${k}`, title: r.course_name ?? '' });
        lastKey = k;
      }
    }
    items.push({ kind: 'row', r });
  }

  const colLabel: React.CSSProperties = { textAlign: 'right', fontSize: 8.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: RT.DIM };
  let firstInGroup = true;

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

      <SeasonSection rounds={rounds} year={year} userId={userId} isOwnProfile={isOwnProfile} ownerFirstName={ownerFirstName} />
      <div style={{ marginTop: 32 }}><YearSection rounds={rounds} year={year} today={today} isOwnProfile={isOwnProfile} ownerFirstName={ownerFirstName} /></div>
      <div style={{ marginTop: 32 }}><CoursesPlayedSection rounds={rounds} userId={userId} viewerId={viewerId} isOwnProfile={isOwnProfile} ownerFirstName={ownerFirstName} /></div>

      <section style={{ marginTop: 32 }}>
        <div style={KICKER}>Every round</div>
        <div style={TITLE}>The log</div>
        <RailChips
          size="sm"
          options={[
            { id: 'recent', label: t('rounds.sort.recent', 'Recent') },
            { id: 'lowest', label: t('rounds.sort.lowest', 'Lowest') },
            { id: 'course', label: t('rounds.sort.course', 'By course') },
          ]}
          value={sort}
          onChange={(next) => { setSort(next as Sort); }}
          ariaLabel={t('rounds.sort.a11y', 'Sort rounds')}
          style={{ marginTop: 14 }}
        />

        <div style={{ display: 'flex', gap: 10, paddingBottom: 6, borderBottom: `1px solid ${RT.HAIRLINE}`, marginTop: 14 }}>
          <span style={{ flex: 1 }} />
          <span style={{ ...colLabel, width: COL.gross }}>Gross</span>
          <span style={{ ...colLabel, width: COL.net }}>Net</span>
          <span style={{ ...colLabel, width: COL.vs }}>Vs hcp</span>
          <span style={{ ...colLabel, width: COL.index }}>Index</span>
        </div>

        <div>
          {items.map((it) => {
            if (it.kind === 'head') {
              firstInGroup = true;
              return (
                <div key={it.key} style={DIVIDER}>
                  <span style={{ ...DIVIDER_TITLE, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.title}</span>
                </div>
              );
            }
            const r = it.r;
            const first = firstInGroup;
            firstInGroup = false;
            const full18 = isFullEighteen(r);
            const toPar = full18 && r.gross_score != null && r.course_par != null ? r.gross_score - r.course_par : null;
            const isBest = full18 && stats.best != null && r.gross_score === stats.best;
            const fs = roundFeats(r, t);
            const net = full18 && r.nett_score != null ? Number(r.nett_score) : null;
            const hasVs = net != null && r.course_par != null;
            const under = hasVs && net! < r.course_par!;
            const toParText = toParLabel(toPar);
            // Deliberately NOT the member's current index: hcp_at_time is the index
            // they held for THAT round. Same header as Explore, different question. Do not "fix".
            const hcpPair = handicapPairDisplay({ handicapIndex: r.hcp_at_time, deltaIndex: r.delta_index });
            const fig: React.CSSProperties = { textAlign: 'right', fontSize: 12.5, fontWeight: 700, ...TAB };
            return (
              <button
                key={r.whs_score_id}
                type="button"
                onClick={() => setOpenId(r.whs_score_id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderTop: first ? 0 : `1px solid ${RT.SOFT}`, padding: '9px 0', cursor: 'pointer', fontFamily: SANS }}
              >
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 12.5, fontWeight: 700, color: RT.INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.course_name ?? ''}
                  </span>
                  <span style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 2, fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: RT.DIM, ...TAB }}>
                    <span>{formatDayMonthShortGB(parsePlayDate(r.play_date))}</span>
                    {medalTotal(r) > 0 ? (
                      <Pill padding="3px 8px">
                        <AwardCluster scale="pill" gold={r.medals_gold ?? 0} silver={r.medals_silver ?? 0} bronze={r.medals_bronze ?? 0} surfaceColor={CHART.CANVAS} />
                      </Pill>
                    ) : null}
                    {!full18 ? (
                      <Pill tone={CHART.MUTE} style={CAPS}>
                        {r.whs_joined && r.is_nine_hole ? t('rounds.nineHoles', '9 holes') : t('rounds.notFull', 'Not a full 18')}
                      </Pill>
                    ) : null}
                    {fs.map((f) => <FeatPill key={f} label={f} />)}
                  </span>
                </span>
                <span style={{ width: COL.gross, flex: 'none', textAlign: 'right', fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: isBest ? CHART.AMBER : RT.INK, ...TAB }}>
                  {r.gross_score != null ? String(r.gross_score) : ''}
                  {toParText ? (
                    <span style={{ marginLeft: 3, fontSize: 9.5, fontWeight: 700, letterSpacing: 0, color: (toPar ?? 0) < 0 ? TOPAR_UNDER_DARK : A.MUTE }}>{toParText}</span>
                  ) : null}
                </span>
                <span style={{ ...fig, width: COL.net, flex: 'none', color: RT.BODY }}>{net != null ? String(net) : ''}</span>
                <span style={{ ...fig, width: COL.vs, flex: 'none', color: under ? TOPAR_UNDER_DARK : RT.INK }}>
                  {hasVs ? vsHandicapLabel(net!, r.course_par!) : ''}
                </span>
                <span style={{ ...fig, width: COL.index, flex: 'none', color: RT.MUTE, whiteSpace: 'nowrap' }}>
                  {hcpPair?.index ?? ''}
                  {hcpPair?.delta ? (
                    <span style={{ marginLeft: 2, fontSize: 9.5, color: hcpPair.delta.tone }} aria-hidden>{hcpPair.delta.arrow}</span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>

        {!showAll && ordered.length > INITIAL_ROWS ? (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            style={{ display: 'block', marginTop: 16, padding: 0, border: 0, background: 'transparent', cursor: 'pointer', fontFamily: SANS, fontSize: 12, fontWeight: 700, color: CHART.AMBER }}
          >
            {`Show all ${formatNumber(rounds.length)} ›`}
          </button>
        ) : null}
      </section>

      <RoundDetailSheet open={openId != null} onClose={() => setOpenId(null)} scoreId={openId} profileUserId={userId} />
    </div>
  );
};

export default ProfileRoundsTab;
