import { useTranslation } from 'react-i18next';

import { CourseImageFallback } from './CourseImageFallback';
import type { CommunityCreator } from './hooks/useCommunityCreators';
import { SCRIM_STRONG } from './tokens';

/**
 * CREATOR CARD — "B, frame overlay" (BRIEF_COMMUNITY_CREATOR_CARDS).
 *
 * The card is a MEDIA TILE: full-bleed frame from one of the creator's OWN
 * recent items, a real gradient scrim, overlaid identity. Only three things
 * separate it from the eight moments around it, so all three are LOAD-BEARING:
 *
 *   1. THE CREATOR CHIP, top left. Solid fill, never a tint, never conditional.
 *   2. THE AVATAR RING — a solid light stroke, so the avatar reads as a person
 *      and not a logo burned into the photograph.
 *   3. THE CAPTION IS A PERSON. NO COURSE NAME ANYWHERE: every other tile is
 *      captioned with a place, and the moment this one is too it is
 *      indistinguishable.
 *
 * No border (it would be the only bordered thing in a borderless grid), no
 * amber (amber means the viewing member and this is someone else), no autoplay
 * (the section's rule), nothing at weight 800, nothing below 8.5px.
 *
 * ONE TAP TARGET. The whole card opens the fullscreen viewer seeded with that
 * member's moments; the avatar is not a second target.
 */

/** Height is ARITHMETIC, not a design choice: a column-flow card is TALL. */
interface Props {
  creator: CommunityCreator;
  height: number;
  radius: number;
  onPress: (c: CommunityCreator) => void;
  style?: React.CSSProperties;
}

export function CreatorCard({ creator, height, radius, onPress, style }: Props) {
  const { t } = useTranslation('courses');

  // OMIT A ZERO COMPONENT. Never "0 clips", never the word "posts".
  const parts: string[] = [];
  if (creator.clips > 0) {
    parts.push(t('discover.creator.clips', { count: creator.clips, defaultValue: '{{count}} clips' }));
  }
  if (creator.photos > 0) {
    parts.push(t('discover.creator.photos', { count: creator.photos, defaultValue: '{{count}} photos' }));
  }
  const counts = parts.join(' · ');

  const initials = (creator.displayName || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <button
      type="button"
      onClick={() => onPress(creator)}
      aria-label={`${creator.displayName} — ${counts}`}
      style={{
        position: 'relative',
        display: 'block',
        width: '100%',
        height,
        padding: 0,
        border: 'none',
        background: 'transparent',
        borderRadius: radius,
        overflow: 'hidden',
        textAlign: 'left',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {/* THE FRAME IS ONE OF THEIR OWN recent items, never a generic image. */}
      <CourseImageFallback
        courseId={creator.frame.courseId}
        courseName={creator.displayName}
        imageUrl={creator.frame.thumbnail}
        initialsSize={30}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <div style={{ position: 'absolute', inset: 0, background: SCRIM_STRONG }} />

        {/* 1. THE CHIP. Unconditional, readable over any frame. The substrate is
            the platform's badge GLASS (`.standout-figure-chip`, the 77-gross
            chip in Personal Bests): flat base fill plus hairline, blur only as
            an @supports enhancement — never a tint of the photo. */}
        <span
          className="standout-figure-chip"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            color: '#FFFFFF',
            fontSize: 8.5,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            borderRadius: 4,
            padding: '3px 5px',
            /* Dark glass now (BRIEF_GLASS_BADGES_DARK) — no shadow floor. */
          }}
        >
          {t('discover.creator.chip', 'Creator')}
        </span>


        <div
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            bottom: 7,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 0,
          }}
        >
          {/* 2. THE RING — solid light stroke, squircle geometry. */}
          <span
            style={{
              flexShrink: 0,
              width: 34,
              height: 34,
              borderRadius: '34%',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 0 1px #FFFFFF, 0 0 0 1px #FFFFFF',
              background: '#0A0E0A',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {creator.avatarUrl ? (
              <img
                src={creator.avatarUrl}
                alt=""
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span style={{ color: '#FFFFFF', fontSize: 12, fontWeight: 700 }}>{initials}</span>
            )}
          </span>

          <span style={{ minWidth: 0, flex: 1 }}>
            {/* 3. THE CAPTION IS THE PERSON — no course name anywhere. */}
            <span
              style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 700,
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
                textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {creator.displayName}
            </span>
            {counts && (
              <span
                style={{
                  display: 'block',
                  marginTop: 1,
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: '#FFFFFF',
                  letterSpacing: 0,
                  fontVariantNumeric: 'tabular-nums lining-nums',
                  textShadow: '0 1px 6px rgba(0,0,0,0.4)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {counts}
              </span>
            )}
          </span>
        </div>
      </CourseImageFallback>
    </button>
  );
}

export default CreatorCard;
