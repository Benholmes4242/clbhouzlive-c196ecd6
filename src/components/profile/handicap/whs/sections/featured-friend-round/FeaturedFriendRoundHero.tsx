import React from 'react';
import { useFriendFeaturedRound } from '@/lib/whs/hooks';
import { fmtHcp, fmtDiff } from '@/lib/whs/format';
import { reformatFriendName } from '@/lib/whs/utils/nameFormat';
import SectionHeader from '../SectionHeader';
import BuildYourCircleCTA from './BuildYourCircleCTA';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  userId: string;
}

function getFreshnessVariant(days: number): { eyebrow: string; titleVerb: string } {
  if (days <= 2) return { eyebrow: 'FRESH · YOUR RIVAL JUST POSTED', titleVerb: 'just shot' };
  if (days <= 7) return { eyebrow: 'THIS WEEK', titleVerb: 'shot' };
  if (days <= 14) return { eyebrow: 'RECENT HIGHLIGHT', titleVerb: 'shot' };
  return { eyebrow: 'FROM YOUR CIRCLE', titleVerb: 'shot' };
}

export const FeaturedFriendRoundHero: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendFeaturedRound(userId);

  if (isLoading) {
    return <FeaturedHeroSkeleton />;
  }

  if (!data) {
    return <BuildYourCircleCTA />;
  }

  const variant = getFreshnessVariant(data.freshness_window_days);
  const friendDisplay = reformatFriendName(data.friend_name);
  const initials = friendDisplay.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
  const courseImage = data.course_thumbnail_image;
  const courseName = data.course_name ?? 'Unknown course';

  const impactDelta =
    data.is_counter && data.handicap_index_at_time !== null && data.friend_handicap_index !== null
      ? data.friend_handicap_index - data.handicap_index_at_time
      : null;

  return (
    <section style={{ padding: '20px 0 8px' }}>
      <SectionHeader
        eyebrow={variant.eyebrow}
        title={`${friendDisplay} ${variant.titleVerb} ${data.adjusted_gross} at ${courseName}`}
      />

      <div style={{ padding: '0 20px' }}>
        <div style={{
          position: 'relative',
          borderRadius: 18,
          overflow: 'hidden',
          minHeight: 280,
          background: courseImage
            ? `linear-gradient(180deg, rgba(10,22,40,0.30) 0%, rgba(10,22,40,0.85) 100%), url(${courseImage})`
            : 'linear-gradient(160deg, #0a1628, #060c16)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          color: '#fff',
          fontFamily: FONT_GEIST,
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2.5,
            background: 'linear-gradient(90deg, rgba(245,158,11,0.8), transparent)',
          }} />

          {data.is_personal_best && (
            <div style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'linear-gradient(135deg, #F59E0B, #C97211)',
              color: '#fff',
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: '0.18em',
              padding: '5px 10px',
              borderRadius: 999,
              boxShadow: '0 4px 12px -2px rgba(247,147,30,0.5)',
            }}>
              PERSONAL BEST
            </div>
          )}

          <div style={{
            position: 'absolute',
            top: 14,
            left: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}>
            {data.friend_thumbnail_url ? (
              <img
                src={data.friend_thumbnail_url}
                alt={friendDisplay}
                style={{
                  width: 36, height: 36,
                  borderRadius: '34%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.85)',
                }}
              />
            ) : (
              <div style={{
                width: 36, height: 36,
                borderRadius: '34%',
                background: 'rgba(255,255,255,0.15)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 13,
                fontWeight: 800,
                border: '2px solid rgba(255,255,255,0.85)',
              }}>
                {initials}
              </div>
            )}
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em' }}>
                {friendDisplay}
              </p>
              {data.friend_handicap_index !== null && (
                <p style={{ margin: '2px 0 0', fontSize: 10, fontWeight: 700, opacity: 0.75, letterSpacing: '0.04em' }}>
                  HCP {fmtHcp(data.friend_handicap_index)}
                </p>
              )}
            </div>
          </div>

          <div style={{ padding: '60px 18px 14px' }}>
            <h3 style={{
              fontFamily: FONT_GEIST,
              fontSize: 26,
              fontWeight: 900,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              margin: 0,
              color: '#fff',
            }}>
              Shot <span style={{ color: '#F59E0B' }}>{data.adjusted_gross}</span> at{' '}
              <em style={{ fontStyle: 'italic', fontWeight: 700 }}>{courseName}</em>
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8,
            padding: '0 14px 14px',
          }}>
            <StatTile label="GROSS" value={String(data.adjusted_gross)} />
            <StatTile
              label="DIFF"
              value={data.handicap_differential !== null ? fmtDiff(data.handicap_differential, { plus: true }) : '—'}
            />
            <StatTile
              label="IMPACT"
              value={impactDelta !== null ? fmtDiff(impactDelta, { plus: true }) : '—'}
              highlight={
                impactDelta === null
                  ? 'neutral'
                  : impactDelta < 0 ? 'green' : impactDelta > 0 ? 'red' : 'neutral'
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
};

interface StatTileProps {
  label: string;
  value: string;
  highlight?: 'green' | 'red' | 'neutral';
}

const StatTile: React.FC<StatTileProps> = ({ label, value, highlight = 'neutral' }) => {
  const valueColor =
    highlight === 'green' ? '#86EFAC' :
    highlight === 'red' ? '#FCA5A5' :
    '#fff';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.10)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: '10px 12px',
      textAlign: 'center',
    }}>
      <p style={{
        margin: 0,
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: '0.18em',
        color: 'rgba(255,255,255,0.65)',
      }}>
        {label}
      </p>
      <p style={{
        margin: '4px 0 0',
        fontSize: 18,
        fontWeight: 800,
        letterSpacing: '-0.02em',
        color: valueColor,
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
};

const FeaturedHeroSkeleton: React.FC = () => (
  <section style={{ padding: '20px 20px 8px' }}>
    <div className="animate-pulse" style={{
      height: 280,
      background: 'rgba(15,23,42,0.04)',
      borderRadius: 18,
    }} />
  </section>
);

export default FeaturedFriendRoundHero;
