/**
 * BusinessProfileHero - the business profile's mounting of the SHARED HeroShell
 * (BRIEF_BUSINESS_PROFILE_HERO). Identical geometry, scrim, identity row,
 * headline slot and counter strip as the personal profile hero; only the
 * figures differ.
 *
 * Club business: COMMUNITY RATING (average across every course of the club)
 * with its rating count, and four counters.
 * Non-club business: no headline block at all, two centred counters.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { getInitialsFromName, getAvatarFallbackColor } from '@/lib/avatarFallback';
import { A, SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { bandColorOnDark } from '@/features/courses/_shared/scoreBands';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HeroShell, W_55 } from '@/components/profile/hero/HeroShell';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export type BusinessHeroStat = 'followers' | 'posts' | 'rounds' | 'rated';

/** "golf_club" / "OTHER" -> "Golf club". Sentence case, never caps. */
function sentenceCase(value: string): string {
  const clean = value.replace(/[_-]+/g, ' ').trim().toLowerCase();
  if (!clean) return '';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

interface Props {
  name: string;
  logoUrl?: string | null;
  coverUrl?: string | null;
  fallbackKey?: string | null;
  verified?: boolean;
  /**
   * PHASE 5B §2 — what was actually confirmed, in plain words. Rendered UNDER
   * the badge on the profile only; null for a pre-Phase-3 approval (§2.5).
   */
  evidenceLine?: string | null;
  category?: string | null;
  city?: string | null;
  region?: string | null;
  country?: string | null;
  /** Club branch when the business resolves to at least one course. */
  isClub: boolean;
  avgRating?: number | null;
  ratingsCount?: number | null;
  roundsTracked?: number | null;
  followersCount?: number | null;
  postsCount?: number | null;
  action?: React.ReactNode;
  onAvatarTap?: () => void;
  onStatTap: (stat: BusinessHeroStat) => void;
  /** Multi-course clubs cannot resolve a single destination yet - inert. */
  courseNavEnabled: boolean;
}

export const BusinessProfileHero: React.FC<Props> = ({
  name,
  logoUrl,
  coverUrl,
  fallbackKey,
  verified,
  evidenceLine,
  category,
  city,
  region,
  country,
  isClub,
  avgRating,
  ratingsCount,
  roundsTracked,
  followersCount,
  postsCount,
  action,
  onAvatarTap,
  onStatTap,
  courseNavEnabled,
}) => {
  const { t } = useTranslation();
  const initials = getInitialsFromName(name) || 'B';

  const metaLine = React.useMemo(() => {
    const bits: string[] = [];
    if (category) bits.push(sentenceCase(category));
    const place = city || region || country || null;
    if (place) bits.push(place);
    return bits.length ? bits.join(' \u00B7 ') : null;
  }, [category, city, region, country]);

  /* §2.1 — one badge, and beneath it what was confirmed. §2.4 keeps this on the
     profile: the badge travels, the evidence line stays home. */
  const showEvidence = !!verified && !!evidenceLine;
  const subline: React.ReactNode = (metaLine || showEvidence) ? (
    <>
      {metaLine && <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{metaLine}</div>}
      {showEvidence && (
        <div style={{ marginTop: 1, color: A.AMBER, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {evidenceLine}
        </div>
      )}
    </>
  ) : null;

  const tap = (stat: BusinessHeroStat) => () => {
    void analyticsEvents.track('business_hero_stat_tap', { stat });
    onStatTap(stat);
  };

  const showRating = isClub && avgRating != null && (ratingsCount ?? 0) > 0;

  return (
    <HeroShell
      coverUrl={coverUrl}
      onAvatarTap={onAvatarTap}
      avatarLabel={name}
      avatar={
        logoUrl ? (
          <img src={logoUrl} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: getAvatarFallbackColor(fallbackKey || name),
              color: '#FFFFFF',
              fontFamily: SANS,
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            {initials}
          </div>
        )
      }
      displayName={name}
      nameSuffix={
        verified ? (
          <span
            aria-label={t('business.hero.verified', 'Verified')}
            style={{ display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6 }}
          >
            <VerifiedBadge size="md" />
          </span>
        ) : undefined
      }
      subline={subline}
      action={action}
      headline={
        showRating
          ? {
              label: t('business.hero.communityRating', 'Community rating'),
              ariaLabel: t('business.hero.communityRating', 'Community rating'),
              value: (avgRating as number).toFixed(1),
              color: bandColorOnDark(avgRating),
              aside: (
                <span
                  style={{
                    paddingBottom: 3,
                    fontSize: 11.5,
                    fontWeight: 700,
                    color: W_55,
                    fontFamily: SANS,
                    ...FIGS,
                  }}
                >
                  {t('business.hero.ratings', { count: ratingsCount ?? 0, defaultValue: '{{count}} ratings' })}
                </span>
              ),
            }
          : null
      }
      centreCounters={!isClub}
      counters={
        isClub
          ? [
              { key: 'followers', label: t('business.reach.followers'), value: followersCount ?? null, onTap: tap('followers') },
              { key: 'posts', label: t('business.reach.posts'), value: postsCount ?? null, onTap: tap('posts') },
              {
                key: 'rounds',
                label: t('business.reach.rounds'),
                value: roundsTracked ?? null,
                onTap: courseNavEnabled ? tap('rounds') : undefined,
              },
              {
                key: 'rated',
                label: t('business.reach.rated'),
                value: ratingsCount ?? null,
                onTap: courseNavEnabled ? tap('rated') : undefined,
              },
            ]
          : [
              { key: 'followers', label: t('business.reach.followers'), value: followersCount ?? null, onTap: tap('followers') },
              { key: 'posts', label: t('business.reach.posts'), value: postsCount ?? null, onTap: tap('posts') },
            ]
      }
    />
  );
};

export default BusinessProfileHero;
