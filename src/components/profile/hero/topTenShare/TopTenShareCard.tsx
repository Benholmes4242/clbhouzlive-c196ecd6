/**
 * BRIEF_TOP_TEN_SHARE_CARD_V2 §1/§3 — ONE Top 10 share card, exact to the
 * signed-off mocks (top10_share_story_9x16.html, top10_share_post_4x5.html).
 * Story 405x720, post 405x506. Rendered full-size off-screen for capture and
 * scaled inside the share sheet preview.
 *
 * Photos arrive as `photos` (object URLs resolved CORS-safely by the sheet);
 * a missing/failed slot renders a #16161A panel with the same scrim and text,
 * never a broken image (§4). `showHeroPhoto` off puts the hero in that panel.
 *
 * §6 DESCENDER CLIPPING: every ellipsis line carries CLIP (2px paddingBottom
 * with -2px marginBottom) instead of a line-height change, so html2canvas
 * does not cut g/y/p and the mock's visual spacing is untouched.
 *
 * The wordmark is the white variant of the app asset: the shipped
 * clbhouz-wordmark asset is black-on-transparent (opaque pixels average
 * RGB 0,0,0; JoinLandingPage inverts it for dark use), so a white PNG was
 * derived from it rather than relying on CSS invert surviving capture.
 */
import React from 'react';
import { useTranslation } from 'react-i18next';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { getRatingTierLabel } from '@/lib/ratingTier';
import { shareCourseName } from '@/lib/courses/shareCourseName';
import wordmarkWhite from '@/assets/clbhouz-wordmark-white.png.asset.json';

export interface TopTenShareCourse {
  position: number;
  name: string;
  region?: string | null;
  sub_country?: string | null;
  country?: string | null;
  thumbnail_image?: string | null;
  rating?: number | null;
}

export interface TopTenShareCardIdentity {
  displayName: string;
  avatarUrl?: string | null;
  handicapIndex?: number | null;
  rounds?: number | null;
  rated?: number | null;
}

interface Props {
  format: 'story' | 'post';
  courses: TopTenShareCourse[];
  identity: TopTenShareCardIdentity;
  showHandicap: boolean;
  showHeroPhoto: boolean;
  /** Resolved image sources for positions 1-3; null = fallback panel. */
  photos: (string | null)[];
}

const FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
const CANVAS = '#0A0A0C';
const PANEL = '#16161A';
const ON_PHOTO = '#FFFFFF';
const ON_PHOTO_SUB = 'rgba(255,255,255,0.74)';
const ON_PHOTO_KICKER = 'rgba(255,255,255,0.7)';
const ROW_NUM = 'rgba(248,250,252,0.42)';
const ROW_PLACE = 'rgba(248,250,252,0.46)';
const STAT = 'rgba(248,250,252,0.55)';
const RULE = 'rgba(255,255,255,0.07)';
const FOOT_RULE = 'rgba(255,255,255,0.12)';

/** §6: descender protection for overflow-hidden lines, spacing-neutral. */
const CLIP: React.CSSProperties = { paddingBottom: 2, marginBottom: -2 };

const scoreColor = (r: number | null | undefined) => (r != null && r >= 9 ? A.GREEN : A.INK);

/** Story tiles/rows: "variant · region"; no variant: "region, sub_country". */
const richPlace = (c: TopTenShareCourse, variant: string | null) =>
  variant
    ? [variant, c.region].filter(Boolean).join(' · ')
    : [c.region, c.sub_country].filter(Boolean).join(', ');
/** Post rows/tiles: one word — variant, else region, else sub_country. */
const tersePlace = (c: TopTenShareCourse, variant: string | null) =>
  variant || c.region || c.sub_country || '';
/** Hero (story and post): "variant · region, sub_country"; parts omitted when missing. */
const heroPlace = (c: TopTenShareCourse, variant: string | null) =>
  [variant, [c.region, c.sub_country].filter(Boolean).join(', ')].filter(Boolean).join(' · ');

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join('');

export const TopTenShareCard: React.FC<Props> = ({
  format,
  courses,
  identity,
  showHandicap,
  showHeroPhoto,
  photos,
}) => {
  const { t } = useTranslation('profile');
  const story = format === 'story';

  const [hero, two, three, ...rest] = courses;
  const tiles = [two, three].filter(Boolean) as TopTenShareCourse[];
  const rows = rest.slice(0, 7);

  const countries = new Set(
    courses.map((c) => c.sub_country || c.country).filter(Boolean) as string[],
  ).size;
  const statParts: string[] = [];
  if (showHandicap && identity.handicapIndex != null) {
    statParts.push(
      t('topTen.share.hcp', { value: identity.handicapIndex.toFixed(1), defaultValue: '{{value}} HCP' }),
    );
  }
  if (identity.rounds != null) {
    statParts.push(t('topTen.share.rounds', { count: identity.rounds, defaultValue: '{{count}} rounds' }));
  }
  if (identity.rated != null) {
    statParts.push(t('topTen.share.rated', { count: identity.rated, defaultValue: '{{count}} rated' }));
  }
  if (countries > 0) {
    statParts.push(t('topTen.share.countries', { count: countries, defaultValue: '{{count}} countries' }));
  }
  const statLine = statParts.join(' · ');

  const heroName = hero ? shareCourseName(hero.name) : null;
  const firstName = identity.displayName.trim().split(/\s+/)[0] || '';
  const kicker = story
    ? t('topTen.share.cardTitle', 'My top 10')
    : t('topTen.share.cardTitleNamed', { name: firstName, defaultValue: "{{name}}'s top 10" });

  return (
    <div
      style={{
        width: 405,
        height: story ? 720 : 506,
        overflow: 'hidden',
        position: 'relative',
        background: CANVAS,
        color: '#F8FAFC',
        fontFamily: FONT,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {/* HERO — position 1 */}
      {hero && heroName && (
        <div data-share-hero style={{ position: 'relative', height: story ? 256 : 160, overflow: 'hidden' }}>
          {showHeroPhoto && photos[0] && (
            <img
              src={photos[0]}
              alt={`${heroName.short}${heroName.variant ? `, ${heroName.variant}` : ''} course`}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {(!showHeroPhoto || !photos[0]) && (
            <div style={{ position: 'absolute', inset: 0, background: PANEL }} />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: story
                ? 'linear-gradient(180deg, rgba(10,10,12,0.55) 0%, rgba(10,10,12,0) 28%, rgba(10,10,12,0) 42%, rgba(10,10,12,0.86) 82%, #0A0A0C 100%)'
                : 'linear-gradient(180deg, rgba(10,10,12,0.5) 0%, rgba(10,10,12,0) 34%, rgba(10,10,12,0.84) 80%, #0A0A0C 100%)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: story ? 22 : 16,
              left: story ? 22 : 20,
              right: story ? 22 : 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <img src={wordmarkWhite.url} alt="clbhouz" style={{ display: 'block', height: story ? 17 : 15, width: 'auto' }} />
            <span
              style={{
                fontSize: story ? 10.5 : 10,
                fontWeight: 800,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: A.AMBER,
              }}
            >
              {kicker}
            </span>
          </div>
          <div
            style={{
              position: 'absolute',
              left: story ? 22 : 20,
              right: story ? 22 : 20,
              bottom: story ? 12 : 8,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: story ? 14 : 12,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: story ? 10.5 : 9.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ON_PHOTO_KICKER }}>
                {t('topTen.share.no', { n: 1, defaultValue: 'No. {{n}}' })}
              </div>
              <div style={{ marginTop: story ? 6 : 3, fontSize: story ? 31 : 24, fontWeight: 800, letterSpacing: '-0.035em', lineHeight: story ? 1.02 : 1.04, color: ON_PHOTO }}>
                {heroName.short}
              </div>
              <div style={{ marginTop: story ? 6 : 3, fontSize: story ? 12 : 11, fontWeight: 600, lineHeight: story ? 1.3 : undefined, color: ON_PHOTO_SUB }}>
                {heroPlace(hero, heroName.variant)}
              </div>
            </div>
            <div style={{ flexShrink: 0, textAlign: 'right' }}>
              <div style={{ fontSize: story ? 46 : 34, fontWeight: 800, letterSpacing: '-0.045em', lineHeight: 0.95, color: scoreColor(hero.rating) }}>
                {hero.rating != null ? hero.rating.toFixed(1) : ''}
              </div>
              {hero.rating != null && (
                <div style={{ marginTop: story ? 6 : 4, fontSize: story ? 9.5 : 8.5, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: scoreColor(hero.rating) }}>
                  {getRatingTierLabel(hero.rating)}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TILES — positions 2 and 3 */}
      {tiles.length > 0 && (
        <div
          style={{
            margin: story ? '10px 22px 0' : '8px 20px 0',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: story ? 10 : 8,
          }}
        >
          {tiles.map((c, i) => {
            const nm = shareCourseName(c.name);
            const photo = photos[i + 1];
            return (
              <div
                key={c.position}
                data-share-tile={c.position}
                style={{ position: 'relative', height: story ? 112 : 86, borderRadius: story ? 12 : 10, overflow: 'hidden' }}
              >
                {photo ? (
                  <img
                    src={photo}
                    alt={`${nm.short}${nm.variant ? `, ${nm.variant}` : ''} course`}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ position: 'absolute', inset: 0, background: PANEL }} />
                )}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: story
                      ? 'linear-gradient(180deg, rgba(10,10,12,0) 20%, rgba(10,10,12,0.88) 100%)'
                      : 'linear-gradient(180deg, rgba(10,10,12,0) 15%, rgba(10,10,12,0.88) 100%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: story ? 11 : 10,
                    right: story ? 11 : 10,
                    bottom: story ? 9 : 7,
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: story ? 8 : 6,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: story ? 9 : 8.5, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: ON_PHOTO_KICKER }}>
                      {t('topTen.share.no', { n: c.position, defaultValue: 'No. {{n}}' })}
                    </div>
                    <div
                      style={{
                        marginTop: story ? 3 : 2,
                        fontSize: story ? 15 : 13,
                        fontWeight: 800,
                        letterSpacing: story ? '-0.025em' : '-0.02em',
                        lineHeight: story ? 1.08 : 1.1,
                        color: ON_PHOTO,
                        ...(!story ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...CLIP } : null),
                      }}
                    >
                      {nm.short}
                    </div>
                    <div
                      style={{
                        marginTop: story ? 2 : 1,
                        fontSize: story ? 10 : 9.5,
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.72)',
                        ...(story ? { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...CLIP } : null),
                      }}
                    >
                      {story ? richPlace(c, nm.variant) : tersePlace(c, nm.variant)}
                    </div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: story ? 20 : 17, fontWeight: 800, letterSpacing: story ? '-0.035em' : '-0.03em', lineHeight: 1, color: scoreColor(c.rating) }}>
                    {c.rating != null ? c.rating.toFixed(1) : ''}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ROWS — positions 4-10 */}
      {rows.length > 0 && (
        <div style={{ padding: story ? '6px 22px 0' : '4px 20px 0' }}>
          {rows.map((c, i) => {
            const nm = shareCourseName(c.name);
            return story ? (
              <div
                key={c.position}
                data-share-row={c.position}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '30px minmax(0, 1fr) 46px',
                  alignItems: 'center',
                  height: 36,
                  borderTop: i > 0 ? `1px solid ${RULE}` : 'none',
                }}
              >
                <span style={{ fontSize: 12, fontWeight: 800, color: ROW_NUM }}>{String(c.position).padStart(2, '0')}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 750, letterSpacing: '-0.015em', lineHeight: 1.15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', ...CLIP }}>
                    {nm.short}
                  </div>
                  <div style={{ marginTop: 1, fontSize: 10.5, fontWeight: 500, lineHeight: 1.25, color: ROW_PLACE, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {richPlace(c, nm.variant)}
                  </div>
                </div>
                <span style={{ textAlign: 'right', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(c.rating) }}>
                  {c.rating != null ? c.rating.toFixed(1) : ''}
                </span>
              </div>
            ) : (
              <div
                key={c.position}
                data-share-row={c.position}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '26px minmax(0, 1fr) 40px',
                  alignItems: 'center',
                  height: 27,
                  borderTop: i > 0 ? `1px solid ${RULE}` : 'none',
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 800, color: ROW_NUM }}>{String(c.position).padStart(2, '0')}</span>
                <div style={{ minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13, fontWeight: 750, letterSpacing: '-0.01em', ...CLIP }}>
                  {nm.short}{' '}
                  <span style={{ fontSize: 10.5, fontWeight: 500, letterSpacing: 0, color: ROW_PLACE }}>{tersePlace(c, nm.variant)}</span>
                </div>
                <span style={{ textAlign: 'right', fontSize: 14, fontWeight: 800, letterSpacing: '-0.02em', color: scoreColor(c.rating) }}>
                  {c.rating != null ? c.rating.toFixed(1) : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* FOOTER */}
      <div
        style={{
          position: 'absolute',
          left: story ? 22 : 20,
          right: story ? 22 : 20,
          bottom: story ? 20 : 14,
          paddingTop: story ? 14 : 10,
          borderTop: `1px solid ${FOOT_RULE}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {story ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {identity.avatarUrl ? (
              <img
                src={identity.avatarUrl}
                crossOrigin="anonymous"
                alt=""
                style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 11, objectFit: 'cover' }}
              />
            ) : (
              <span
                style={{
                  width: 34,
                  height: 34,
                  flexShrink: 0,
                  borderRadius: 11,
                  background: '#1C1D22',
                  border: '1px solid rgba(255,255,255,0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                }}
              >
                {initialsOf(identity.displayName)}
              </span>
            )}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, letterSpacing: '-0.01em' }}>{identity.displayName}</div>
              <div style={{ marginTop: 2, fontSize: 10.5, fontWeight: 600, color: STAT, whiteSpace: 'nowrap' }}>{statLine}</div>
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 10.5, fontWeight: 600, color: STAT, whiteSpace: 'nowrap' }}>{statLine}</div>
        )}
      </div>
    </div>
  );
};

export default TopTenShareCard;
