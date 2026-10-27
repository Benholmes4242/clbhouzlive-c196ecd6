/**
 * ClubProfileHero (CB103) — the golf-club business profile hero, built from
 * the signed-off club-s1-hero mock. Rendered ONLY when the page's isClub
 * condition holds (club_id and at least one course); non-club businesses keep
 * BusinessProfileHero and personal profiles keep HeroShell, both untouched.
 *
 * The page owns every action (follow, share, menu, message, navigation) and
 * the permission flags; this component only lays them out.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Share, MoreHorizontal, Plus, MessageCircle, Pencil } from 'lucide-react';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { HERO_CONTENT_INSET } from '@/components/profile/hero/HeroShell';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

const CANVAS = '#0B0B0D';
const INK = '#F8FAFC';
const MUTE = 'rgba(248,250,252,0.62)';
const DIM = 'rgba(248,250,252,0.42)';
const HAIR = 'rgba(255,255,255,0.08)';
const GLASS_BG = 'rgba(255,255,255,0.07)';
const GLASS_BORDER = '1px solid rgba(255,255,255,0.14)';
const SCRIM = 'linear-gradient(180deg, rgba(11,11,13,0.15) 0%, rgba(11,11,13,0.35) 45%, #0B0B0D 100%)';
const ICON = { size: 16, strokeWidth: 1.9 } as const;
const FIGS: React.CSSProperties = { fontVariantNumeric: 'tabular-nums', fontFeatureSettings: '"kern" 1, "liga" 1' };

export interface ClubPlaceInput {
  city?: string | null;
  region?: string | null;
  country?: string | null;
  firstCourseRegion?: string | null;
  courseCount: number;
}

/** The place value the hero line shows: city/region with nation names
 * filtered out, else the first course's region, else the country. Pure, so
 * shared consumers (CB107.2 Visiting directions) cannot drift from the hero. */
export function clubPlace(
  { city, region, country, firstCourseRegion }: Omit<ClubPlaceInput, 'courseCount'>,
): string {
  const nations = new Set(['england', 'scotland', 'wales', 'northern ireland', 'ireland', 'republic of ireland', 'united kingdom', 'uk', 'great britain', 'britain', 'britain & ireland', country?.trim().toLowerCase()]);
  const own = [city, region].map((s) => s?.trim()).filter((s) => s && !nations.has(s.toLowerCase())).join(', ');
  return own || firstCourseRegion?.trim() || country?.trim() || '';
}

/** "Golf club · Bromley, Kent · 2 courses". Pure, so it is tested directly. */
export function clubPlaceLine(
  { city, region, country, firstCourseRegion, courseCount }: ClubPlaceInput,
  labels: { golfClub: string; courses: (n: number) => string },
): string {
  return [labels.golfClub, clubPlace({ city, region, country, firstCourseRegion }), courseCount >= 2 ? labels.courses(courseCount) : '']
    .filter(Boolean)
    .join(' \u00B7 ');
}

/**
 * CB103 team-row gates — each reuses the permission the app already applies:
 * Your courses = mayHaveClubAnalytics (BusinessCommandCard.showClubAnalytics),
 * Insights = canViewInsights, Post = role !== 'analyst' (BusinessHomeHeader
 * canPost), Edit = canManage or editor (the profile's edit menu item).
 */
export function clubTeamGates(
  membership: { role: string; canViewInsights: boolean; canManage: boolean } | null | undefined,
  clubAnalytics: boolean,
) {
  if (!membership) return null;
  return {
    yourCourses: clubAnalytics,
    insights: membership.canViewInsights,
    post: membership.role !== 'analyst',
    edit: membership.canManage || membership.role === 'editor',
  };
}

export interface ClubTeamActions {
  onYourCourses?: () => void;
  onInsights?: () => void;
  onPost?: () => void;
  onEdit?: () => void;
}

interface Props {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  fallbackKey?: string | null;
  verified?: boolean;
  evidenceLine?: string | null;
  placeLine: string;
  onAvatarTap?: () => void;
  onShare: () => void;
  /** The existing menu, rendered around the More circle by the page. */
  renderMore: (trigger: React.ReactElement) => React.ReactNode;
  /** Team row actions; each present only when its permission passes. */
  team: ClubTeamActions | null;
  isFollowing: boolean;
  onFollowToggle: () => void;
  onBookTeeTime: () => void;
  onMessage: () => void;
  messageDisabled?: boolean;
  avgRating?: number | null;
  ratingsCount?: number | null;
  roundsTracked?: number | null;
  membersHere?: number | null;
  onRatingTap?: () => void;
  onRoundsTap?: () => void;
  about?: string | null;
}

const pill = (kind: 'white' | 'glass'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 7, height: 38, padding: '0 16px',
  borderRadius: 999, fontSize: 14.5, fontWeight: 600, whiteSpace: 'nowrap', flex: 'none',
  fontFamily: SANS, cursor: 'pointer',
  ...(kind === 'white'
    ? { background: INK, color: CANVAS, border: 'none' }
    : { background: GLASS_BG, border: GLASS_BORDER, color: INK }),
});
const circle = (d: number): React.CSSProperties => ({
  width: d, height: d, borderRadius: 999, flex: 'none', padding: 0,
  background: GLASS_BG, border: GLASS_BORDER, color: INK,
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
});

export const ClubProfileHero: React.FC<Props> = (p) => {
  const { t } = useTranslation();
  const initials = getInitialsFromName(p.name) || 'B';
  const showEvidence = !!p.verified && !!p.evidenceLine;
  const team = p.team && Object.values(p.team).some(Boolean) ? p.team : null;

  const cells: Array<{ key: string; value: string; label: string; color?: string; onTap?: () => void }> = [];
  if (p.avgRating != null && p.avgRating >= 1 && (p.ratingsCount ?? 0) >= 1) {
    cells.push({
      key: 'rating', value: p.avgRating.toFixed(1),
      label: t('business.clubHero.reviews', { count: p.ratingsCount!, defaultValue: '{{count}} reviews' }),
      color: A.INK, onTap: p.onRatingTap,
    });
  }
  if ((p.roundsTracked ?? 0) >= 1) {
    cells.push({ key: 'rounds', value: p.roundsTracked!.toLocaleString(), label: t('business.clubHero.roundsTracked', 'Rounds tracked'), onTap: p.onRoundsTap });
  }
  if ((p.membersHere ?? 0) >= 1) {
    cells.push({ key: 'members', value: p.membersHere!.toLocaleString(), label: t('business.clubHero.membersHere', 'Members here') });
  }

  const aboutRef = React.useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = React.useState(false);
  const [clamped, setClamped] = React.useState(false);
  React.useEffect(() => {
    const check = () => { const el = aboutRef.current; if (el) setClamped(el.scrollHeight > el.clientHeight); };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [p.about]);

  return (
    <section data-club-hero="" style={{ background: CANVAS, fontFamily: SANS, color: INK }}>
      <div
        data-club-cover=""
        style={{
          position: 'relative',
          height: `max(300px, calc(${HERO_CONTENT_INSET} + 86px))`,
          background: p.coverUrl ? CANVAS : 'linear-gradient(180deg, #17171B 0%, #0B0B0D 100%)',
          overflow: 'hidden',
        }}
      >
        {p.coverUrl && (
          <img src={p.coverUrl} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
        {p.coverUrl && <div aria-hidden style={{ position: 'absolute', inset: 0, background: SCRIM }} />}
      </div>

      <div style={{ position: 'relative', padding: '0 16px', marginTop: -74 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <button
            type="button"
            aria-label={p.name}
            onClick={p.onAvatarTap}
            data-club-crest=""
            style={{ width: 64, height: 64, borderRadius: 16, background: '#F4F4F2', overflow: 'hidden', padding: 0, border: 'none', flex: 'none' }}
          >
            {p.logoUrl ? (
              <img src={p.logoUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: getAvatarFallbackColor(p.fallbackKey || p.name), color: '#FFFFFF', fontSize: 20, fontWeight: 700 }}>
                {initials}
              </span>
            )}
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" aria-label={t('business.clubHero.share', 'Share')} onClick={p.onShare} style={circle(34)}>
              <Share {...ICON} />
            </button>
            {p.renderMore(
              <button type="button" aria-label={t('business.clubHero.more', 'More options')} style={circle(34)}>
                <MoreHorizontal {...ICON} />
              </button>,
            )}
          </div>
        </div>

        <h1 style={{ marginTop: 12, fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15, color: INK, overflowWrap: 'anywhere' }}>
          {p.name}
          {p.verified && (
            <span aria-label="Verified" style={{ display: 'inline-flex', marginLeft: 7, verticalAlign: -1 }}>
              <VerifiedBadge size="lg" />
            </span>
          )}
        </h1>
        <div data-club-place="" style={{ marginTop: 4, fontSize: 14, lineHeight: 1.4, color: MUTE }}>{p.placeLine}</div>
        {showEvidence && (
          <div style={{ marginTop: 1, fontSize: 14, lineHeight: 1.4, color: A.AMBER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.evidenceLine}
          </div>
        )}

        <div
          data-club-actions={team ? 'team' : 'visitor'}
          className="scrollbar-hide"
          style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', flexWrap: 'nowrap', scrollbarWidth: 'none' }}
        >
          {team ? (
            <>
              {team.onYourCourses && <button type="button" style={pill('white')} onClick={team.onYourCourses}>{t('business.clubHero.yourCourses', 'Your courses')}</button>}
              {team.onInsights && <button type="button" style={pill('glass')} onClick={team.onInsights}>{t('business.clubHero.insights', 'Insights')}</button>}
              {team.onPost && <button type="button" aria-label={t('business.clubHero.post', 'Post as the business')} style={circle(38)} onClick={team.onPost}><Plus {...ICON} /></button>}
              {team.onEdit && <button type="button" aria-label={t('business.clubHero.edit', 'Edit business profile')} style={circle(38)} onClick={team.onEdit}><Pencil {...ICON} /></button>}
            </>
          ) : (
            <>
              {p.isFollowing ? (
                <button type="button" style={pill('glass')} onClick={p.onFollowToggle}>{t('business.clubHero.following', 'Following')}</button>
              ) : (
                <button type="button" style={pill('white')} onClick={p.onFollowToggle}>
                  <Plus size={15} strokeWidth={1.9} />
                  {t('business.clubHero.follow', 'Follow')}
                </button>
              )}
              <button
                type="button"
                data-tee-soon=""
                style={{ ...pill('glass'), color: 'rgba(248,250,252,0.5)', borderColor: HAIR }}
                onClick={p.onBookTeeTime}
              >
                {t('business.clubHero.bookTeeTime', 'Book a tee time')}
                <span data-soon-tag="" style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: DIM, border: GLASS_BORDER, borderRadius: 999, padding: '2px 7px' }}>
                  {t('business.clubHero.soon', 'Soon')}
                </span>
              </button>
              <button type="button" aria-label={t('business.clubHero.message', 'Message')} style={circle(38)} onClick={p.onMessage} disabled={p.messageDisabled}>
                <MessageCircle {...ICON} />
              </button>
            </>
          )}
        </div>
      </div>

      {cells.length > 0 && (
        <div
          data-club-strip=""
          style={{ display: 'grid', gridTemplateColumns: `repeat(${cells.length}, 1fr)`, margin: '20px 16px 0', padding: '14px 0', borderTop: `1px solid ${HAIR}`, borderBottom: `1px solid ${HAIR}` }}
        >
          {cells.map((c, i) => {
            const body = (
              <>
                <span style={{ display: 'block', fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', color: c.color ?? INK, ...FIGS }} data-cell-value="">{c.value}</span>
                <span style={{ display: 'block', marginTop: 4, fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: DIM }}>{c.label}</span>
              </>
            );
            const style: React.CSSProperties = { textAlign: 'center', background: 'none', border: 0, borderLeft: i > 0 ? `1px solid ${HAIR}` : 'none', padding: 0, color: INK, fontFamily: SANS };
            return c.onTap ? (
              <button key={c.key} type="button" data-cell={c.key} style={style} onClick={c.onTap}>{body}</button>
            ) : (
              <div key={c.key} data-cell={c.key} style={style}>{body}</div>
            );
          })}
        </div>
      )}

      {p.about && (
        <>
          <p
            ref={aboutRef}
            data-club-about=""
            className={expanded ? 'whitespace-pre-wrap' : 'whitespace-pre-wrap line-clamp-3'}
            style={{ padding: '16px 18px 0', fontSize: 14.5, lineHeight: 1.5, color: MUTE, overflowWrap: 'anywhere' }}
          >
            {p.about}
          </p>
          {(clamped || expanded) && (
            <button
              type="button"
              data-club-about-toggle=""
              onClick={() => setExpanded((v) => !v)}
              style={{ padding: '6px 18px 0', minHeight: 36, background: 'none', border: 'none', fontSize: 14, fontWeight: 600, color: INK, display: 'flex', alignItems: 'center', fontFamily: SANS }}
            >
              {expanded ? t('business.clubHero.aboutLess', 'Less') : t('business.clubHero.aboutMore', 'More')}
            </button>
          )}
        </>
      )}
    </section>
  );
};

export default ClubProfileHero;
