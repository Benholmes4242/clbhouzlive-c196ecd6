/**
 * ROUND POST CARD — THE ONE ROUND CARD, TWO STATES (BRIEF_CLUBHOUSE_ROUND_POST_REBUILD).
 *
 * The ordinary Clubhouse round post and the hero (FeaturedRoundCard) both draw
 * this, in one block order: photograph -> trace strip -> figure row -> award
 * chips -> member row. The ONLY difference a hero carries is the crown pill.
 * No different order, type scale or figure set.
 *
 * VS HANDICAP appears ONCE, on the photograph. The third figure cell is the
 * member's OWN rank among their OWN rounds at this course
 * (get_round_course_context) — never a comparison with other members.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle } from 'lucide-react';
import { ReactionAction } from '@/components/explore-tab-new/courseled/ReactionAction';
import { RoundShape } from '@/components/explore-tab-new/courseled/RoundShape';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { playDateStandalone } from '@/components/explore-tab-new/courseled/discoverWhen';
import type { CircleRoundRow } from '@/hooks/gam/useCircleLatestRounds';
import { useRoundAwards, type RoundAwardRow } from '@/hooks/gam/useRoundAwards';
import { useRoundCourseContext } from '@/lib/whs/useRoundCourseContext';
import { awardTitle } from '@/features/courses/_shared/scorecard/RoundResults';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { CourseImageFallback } from '@/components/whs/CourseImageFallback';
import { celebrateFigureSize } from '@/lib/reactionKind';
import { formatOrdinal } from '@/i18n/format';
import { r as rad } from '@/lib/radius';
import { SANS } from '@/components/explore-tab-new/courseled/tokens';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { INK, INK_FAINT, INK_MUTE, TOPAR_UNDER_DARK, WHITE_ALPHA_08, INK_TINT_02 } from '@/features/tourhub/_shared/tokens';
import { fmtScore } from '@/features/tourhub/utils/fmtScore';
import { goodHoleDots } from './roundTreatment';
import { goodHoleCounts, headlineFigure, roundVerdict } from './roundVerdict';

/** Values this card owns. Where a token exists it is imported, never redeclared. */
const RP = {
  photoH: 200,
  pad: 14,
  white: '#FFFFFF',
  ink30: 'rgba(248,250,252,0.30)',
  unit: 'rgba(255,255,255,0.86)',
  verdict: 'rgba(255,255,255,0.92)',
  vsLabel: 'rgba(255,255,255,0.6)',
  scrim: 'linear-gradient(to top, rgba(4,8,10,0.97) 0%, rgba(4,8,10,0.88) 22%, rgba(4,8,10,0.45) 46%, rgba(4,8,10,0.05) 70%)',
  crownGround: 'linear-gradient(180deg, rgba(214,168,75,0.95), rgba(170,128,48,0.95))',
  crownInk: '#1A1205',
  goldDot: 'linear-gradient(180deg,#E8C87A,#C09A3E)',
  goldBorder: 'rgba(214,168,75,0.4)',
  plainDot: 'linear-gradient(180deg,#D2D8DE,#9AA4AE)',
  shadowName: '0 1px 10px rgba(0,0,0,0.6)',
  shadowFigure: '0 2px 18px rgba(0,0,0,0.55)',
  shadowVerdict: '0 1px 10px rgba(0,0,0,0.7)',
  traceW: 350,
  traceH: 64,
} as const;

const NUM: React.CSSProperties = { fontVariantNumeric: 'tabular-nums lining-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };
const TIER_ORDER: Record<RoundAwardRow['tier'], number> = { gold: 0, silver: 1, bronze: 2 };
const MAX_CHIPS = 3;

export interface RoundPostEngagement {
  likeCount: number;
  liked: boolean;
  likeAvailable: boolean;
  commentCount: number;
  onToggleLike?: () => void;
  onOpenComments: () => void;
}

export interface RoundPostCardProps {
  hero: boolean;
  scoreId: string | null;
  courseName: string | null;
  imageUrl: string | null;
  gross: number | null;
  toPar: number | null;
  par: number | null;
  net: number | null;
  /** Strokes received: adjusted gross minus net. Null when unknown. */
  courseHandicap: number | null;
  stableford: number | null;
  playDate: string | null;
  shape: HoleShape | null | undefined;
  holesInOne: number | null;
  cleanCard: boolean | null;
  who: { userId: string | null; name: string | null; photoUrl: string | null; isViewer: boolean };
  club: string | null;
  engagement?: RoundPostEngagement | null;
  onOpen: () => void;
  onWhoTap?: () => void;
  square?: boolean;
  crownLabel?: string;
  /** Owner affordances (post menu) at the end of the member row. */
  trailing?: React.ReactNode;
}

export function RoundPostCard(p: RoundPostCardProps) {
  const { t, i18n } = useTranslation('courses');
  const { t: tH } = useTranslation('handicap');
  const k = (key: string, opts?: Record<string, unknown>) => t(`roundPost.${key}`, opts);
  const context = useRoundCourseContext(p.scoreId).data ?? null;
  const awards = useRoundAwards(p.scoreId).data?.awards ?? [];

  const vsHcp = p.net != null && p.par != null ? p.net - p.par : null;
  const counts = goodHoleCounts(p.shape);
  const headline = headlineFigure({ stableford: p.stableford, gross: p.gross, toPar: p.toPar });
  const verdict = roundVerdict({
    vsHcp, context, eagles: counts.eagles, holesInOne: p.holesInOne ?? 0,
    cleanCard: p.cleanCard === true, self: p.who.isViewer,
  });
  const name = p.who.isViewer ? t('amateur.stream.you', 'You') : p.who.name?.trim() || t('amateur.stream.aMember', 'A member');
  const subLine = [p.club, playDateStandalone(p.playDate, i18n.language)].filter(Boolean).join(' · ');

  return (
    <div role="button" tabIndex={0} onClick={p.onOpen}
      onKeyDown={(e) => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); p.onOpen(); } }}
      data-round-post-card={p.hero ? 'hero' : 'ordinary'}
      style={{ display: 'block', width: '100%', cursor: 'pointer', fontFamily: SANS, borderRadius: p.square ? 0 : rad.lg, overflow: 'hidden', background: A.PANEL }}>
      {/* A — THE PHOTOGRAPH, CARRYING THE VERDICT */}
      <div style={{ position: 'relative', height: RP.photoH, background: A.PANEL }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : <CourseImageFallback />}
        <div aria-hidden style={{ position: 'absolute', inset: 0, background: RP.scrim, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: RP.pad, left: RP.pad, right: RP.pad, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <span data-round-post-course="true" style={{ flex: '1 1 auto', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: RP.white, textShadow: RP.shadowName }}>
            {p.courseName}
          </span>
          {p.hero ? (
            <span data-round-post-crown="true" style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 5, background: RP.crownGround, borderRadius: 999, padding: '6px 12px', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: RP.crownInk }}>
              <span aria-hidden>★</span>{p.crownLabel ?? k('crown')}
            </span>
          ) : null}
        </div>
        <div style={{ position: 'absolute', left: RP.pad, right: RP.pad, bottom: RP.pad, display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            {headline ? (
              <div data-round-post-headline={headline.kind} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ ...NUM, fontSize: 46, fontWeight: 800, lineHeight: 0.88, letterSpacing: '-0.045em', color: RP.white, textShadow: RP.shadowFigure }}>{headline.value}</span>
                <span style={{ ...NUM, fontSize: 15, fontWeight: 700, color: RP.unit }}>
                  {headline.kind === 'points' ? k('points') : headline.toPar != null ? fmtScore(headline.toPar) : null}
                </span>
              </div>
            ) : null}
            {verdict ? (
              <div data-round-post-verdict="true" style={{ marginTop: 7, fontSize: 12.5, lineHeight: 1.35, color: RP.verdict, textShadow: RP.shadowVerdict }}>
                {verdict.lead ? <>{k(`verdict.${verdict.lead.key}`, verdict.lead.opts)}{k('verdict.joiner')}</> : null}
                <span style={{ fontWeight: 700, color: RP.white }}>{k(`verdict.${verdict.emphasis.key}`, verdict.emphasis.opts)}</span>
                {k('verdict.stop')}
              </div>
            ) : null}
          </div>
          {vsHcp != null ? (
            <div data-round-post-vs-hcp="true" style={{ flex: '0 0 auto', textAlign: 'right' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: RP.vsLabel }}>{k('vsHcp')}</div>
              <div style={{ ...NUM, marginTop: 3, fontSize: 19, fontWeight: 800, letterSpacing: '-0.02em', color: vsHcp < 0 ? TOPAR_UNDER_DARK : RP.white }}>{fmtScore(vsHcp)}</div>
            </div>
          ) : null}
        </div>
      </div>

      {/* C — THE TRACE STRIP. The header is the key; the key is the content. */}
      {p.shape ? (
        <div data-round-post-trace="true" style={{ padding: '10px 14px 8px' }}>
          <TraceKey birdies={counts.birdies} eagles={counts.eagles} k={k} />
          <div style={{ marginTop: 6 }}>
            <RoundShape row={{ round_id: p.scoreId, front_nine_to_par: null, back_nine_to_par: null } as unknown as CircleRoundRow}
              shape={p.shape} width={RP.traceW} height={RP.traceH} showMeta={false}
              exploreDots={goodHoleDots(p.shape)} exploreDotCanvas={A.PANEL}
              postTrace={{ level: k('trace.level'), turn: k('trace.turn') }} />
          </div>
        </div>
      ) : null}

      {/* D — THE FIGURE ROW. Three cells, always three. */}
      <div data-round-post-figures="true" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10, padding: '13px 14px 12px', borderTop: `1px solid ${WHITE_ALPHA_08}` }}>
        <Cell label={k('gross')} value={p.gross} sub={p.par != null ? k('par', { par: p.par }) : null}
          suffix={p.toPar != null ? <span style={{ color: p.toPar < 0 ? TOPAR_UNDER_DARK : INK }}>{fmtScore(p.toPar)}</span> : null} />
        <Cell label={k('net')} value={p.net} sub={p.courseHandicap != null ? k('off', { hcp: p.courseHandicap < 0 ? `+${Math.abs(p.courseHandicap)}` : p.courseHandicap }) : null} />
        <HistoryCell k={k} context={context} />
      </div>

      {/* E — THE AWARDS, BY NAME */}
      <AwardChips awards={awards} title={(a) => awardTitle(a, tH as never, null)} more={(n) => k('awardsMore', { count: n })} />

      {/* F — THE MEMBER ROW */}
      <div data-round-post-member="true" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: `1px solid ${WHITE_ALPHA_08}`, minWidth: 0 }}>
        <span role={p.onWhoTap ? 'button' : undefined} tabIndex={p.onWhoTap ? 0 : undefined}
          onClick={(e) => { if (!p.onWhoTap) return; e.stopPropagation(); p.onWhoTap(); }}
          style={{ display: 'inline-flex', flex: 'none' }}>
          <SquircleAvatar size={34} src={p.who.photoUrl} alt={name} userId={p.who.userId ?? undefined} hairlineRing hideRing={false} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', minWidth: 0, gap: 2 }}>
          <span data-round-post-name="true" style={{ fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', color: p.who.isViewer ? A.AMBER : INK, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</span>
          {subLine ? <span data-round-post-sub="true" style={{ ...NUM, fontSize: 11.5, color: INK_FAINT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subLine}</span> : null}
        </span>
        {p.engagement ? <Actions engagement={p.engagement} mine={p.who.isViewer} /> : null}
        {p.trailing ? <span style={{ flex: 'none' }} onClick={(e) => e.stopPropagation()}>{p.trailing}</span> : null}
      </div>
    </div>
  );
}

type K = (key: string, opts?: Record<string, unknown>) => string;

function TraceKey({ birdies, eagles, k }: { birdies: number; eagles: number; k: K }) {
  if (birdies === 0 && eagles === 0) {
    return <div data-round-post-trace-key="empty" style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.13em', textTransform: 'uppercase', color: INK_FAINT }}>{k('trace.empty')}</div>;
  }
  const item = (n: number, size: number, tone: string, key: string) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span aria-hidden style={{ width: size, height: size, borderRadius: 999, background: tone, flex: 'none' }} />
      <span style={{ fontSize: 10, fontWeight: 600, color: INK_MUTE }}>
        <span style={{ ...NUM, fontWeight: 800, color: INK }}>{n}</span> {k(key, { count: n })}
      </span>
    </span>
  );
  return (
    <div data-round-post-trace-key="counts" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      {birdies > 0 ? item(birdies, 7, TOPAR_UNDER_DARK, 'trace.birdies') : null}
      {eagles > 0 ? item(eagles, 9, SC_FILL_GOLD, 'trace.eagles') : null}
    </div>
  );
}

function CellFrame({ label, children, sub }: { label: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.13em', textTransform: 'uppercase', color: INK_FAINT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3, whiteSpace: 'nowrap' }}>{children}</div>
      {sub ? <div style={{ ...NUM, marginTop: 2, fontSize: 10.5, fontWeight: 600, color: RP.ink30, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div> : null}
    </div>
  );
}

const VALUE: React.CSSProperties = { ...NUM, fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: INK, lineHeight: 1 };
const SUFFIX: React.CSSProperties = { ...NUM, fontSize: 12, fontWeight: 700 };

function Cell({ label, value, suffix, sub }: { label: string; value: number | null; suffix?: React.ReactNode; sub?: string | null }) {
  return (
    <CellFrame label={label} sub={value != null ? sub : null}>
      <span style={VALUE}>{value != null ? value : '\u2014'}</span>
      {value != null && suffix ? <span style={SUFFIX}>{suffix}</span> : null}
    </CellFrame>
  );
}

/** D.4/D.5 — the member's own rank among their own rounds here. Absent,
 *  loading or a first round here renders the label and an em dash. */
export function HistoryCell({ k, context }: { k: K; context: { rank_here: number | null; rounds_here: number | null; best_here: number | null } | null }) {
  const ok = !!context && context.rank_here != null && context.rounds_here != null && context.rounds_here > 1;
  return (
    <div data-round-post-history={ok ? 'ranked' : 'dash'} style={{ minWidth: 0 }}>
      <CellFrame label={k('history')} sub={ok && context!.best_here != null ? k('best', { best: context!.best_here }) : null}>
        <span style={VALUE}>{ok ? formatOrdinal(context!.rank_here!) : '\u2014'}</span>
        {ok ? <span style={{ ...SUFFIX, color: INK_MUTE }}>{k('of', { count: context!.rounds_here })}</span> : null}
      </CellFrame>
    </div>
  );
}

function AwardChips({ awards, title, more }: { awards: RoundAwardRow[]; title: (a: RoundAwardRow) => string; more: (n: number) => string }) {
  if (awards.length === 0) return null;
  const sorted = [...awards].sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
  const shown = sorted.slice(0, MAX_CHIPS);
  const rest = sorted.length - shown.length;
  const chip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, borderRadius: 999, padding: '4px 9px 4px 6px', background: INK_TINT_02, fontSize: 10.5, fontWeight: 700 };
  return (
    <div data-round-post-awards="true" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '0 14px 13px' }}>
      {shown.map((a, i) => {
        const gold = a.tier === 'gold';
        return (
          <span key={`${a.award_kind}:${a.unit_kind}:${a.unit_key}:${i}`} data-award-tier={a.tier}
            style={{ ...chip, border: `1px solid ${gold ? RP.goldBorder : WHITE_ALPHA_08}`, color: gold ? INK : INK_MUTE }}>
            <span aria-hidden style={{ width: 13, height: 13, borderRadius: 999, background: gold ? RP.goldDot : RP.plainDot, flex: 'none' }} />
            {title(a)}
          </span>
        );
      })}
      {rest > 0 ? <span style={{ ...chip, border: `1px solid ${WHITE_ALPHA_08}`, color: RP.ink30 }}>{more(rest)}</span> : null}
    </div>
  );
}

function Actions({ engagement, mine }: { engagement: RoundPostEngagement; mine: boolean }) {
  const { t } = useTranslation('courses');
  const open = (ev: React.SyntheticEvent) => { ev.stopPropagation(); ev.preventDefault(); engagement.onOpenComments(); };
  return (
    <span style={{ flex: 'none', display: 'inline-flex', alignItems: 'center', gap: 24 }} onClick={(e) => e.stopPropagation()}>
      <ReactionAction kind="celebrate" tone="ink" size={20} figureSize={celebrateFigureSize(20)}
        count={engagement.likeCount} reacted={engagement.liked} readOnly={mine}
        hidden={!engagement.likeAvailable || !engagement.onToggleLike}
        onToggle={() => engagement.onToggleLike?.()}
        label={engagement.liked ? t('amateur.round.celebrated', 'Celebrated') : t('amateur.round.celebrate', 'Celebrate this round')} />
      <span role="button" tabIndex={0} aria-label={`Comments, ${engagement.commentCount}`} onClick={open}
        onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') open(ev); }}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: INK, cursor: 'pointer', padding: '13px 12px', margin: '-13px -12px' }}>
        <MessageCircle size={20} strokeWidth={2} color={INK} aria-hidden />
        {engagement.commentCount > 0 ? <span style={{ ...NUM, fontSize: celebrateFigureSize(20), fontWeight: 700, lineHeight: 1 }}>{engagement.commentCount}</span> : null}
      </span>
    </span>
  );
}

export default RoundPostCard;
