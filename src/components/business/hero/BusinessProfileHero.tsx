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
import { SANS, FIGS } from '@/features/courses/components/holes/analytical/tokens';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { HeroShell, W_55 } from '@/components/profile/hero/HeroShell';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';

export type BusinessHeroStat = 'followers' | 'posts' | 'rounds' | 'rated';

/** The shared 0-10 band scale, in its DARK-SURFACE variants: the light hexes
 *  (#047857 / #DC2626) sit too close to INK to read at 40px on this block. */
const DARK_BAND_GREEN = '#4ADE80';
const DARK_BAND_AMBER = '#F7931E';
const DARK_BAND_RED = '#F87171';

function darkBandColor(score: number | null | undefined): string {
  if (score == null) return W_55;
  if (score >= 9) return DARK_BAND_GREEN;
  if (score >= 5) return DARK_BAND_AMBER;
  return DARK_BAND_RED;
}

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

  const subline = React.useMemo(() => {
    const bits: string[] = [];
    if (category) bits.push(sentenceCase(category));
    const place = city || region || country || null;
    if (place) bits.push(place);
    return bits.length ? bits.join(' \u00B7 ') : null;
  }, [category, city, region, country]);

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
              color: darkBandColor(avgRating),
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
