/**
 * BRIEF 35 — the Top 10 share card, exact to ten_share_card.html: the member's ten as the feed
 * photo block (#1 across, 2–10 in three rows, 2px hairlines, one rounded edge, glass score pill).
 * Authored at 405px wide (story 405×720, post 405×506) and exported at 1080/405. Mock units are
 * scaled by 405/300 (story) and 405/320 (post).
 *
 * Photos arrive as `photos[position-1]` blob URLs resolved by resolveSharePhotos; a course with
 * no resolved photo draws the CourseImageFallback look (course gradient + initials) in CSS so it
 * survives export — never #16161A, never black. Only empty positions use the #16161A cell.
 * The pill keeps its rgba background so it still reads if the exporter drops backdrop-filter.
 */
import React from 'react';
import { getInitialsFromName } from '@/lib/avatarFallback';
import { useTranslation } from 'react-i18next';
import { gradientForCourse, initialsForCourse } from '@/components/explore-tab-new/courseled/CourseImageFallback';
import wordmarkWhite from '@/assets/clbhouz-wordmark-white.svg.asset.json';

export interface TopTenShareCourse {
  position: number;
  course_id?: string | null;
  name: string;
  region?: string | null;
  sub_country?: string | null;
  country?: string | null;
  thumbnail_image?: string | null;
  rating?: number | null;
}
export interface TopTenShareCardIdentity {
  displayName: string;
  firstName?: string | null;
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
  /** Resolved blob URLs by position − 1; null = CSS course fallback. */
  photos: (string | null)[];
}

const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const CANVAS = '#0A0A0C';
const EMPTY = '#16161A';
const INK = '#F8FAFC';
const LOC = 'rgba(255,255,255,0.66)';
const STAT = 'rgba(248,250,252,0.42)';
const AVATAR_FALLBACK = '#1C1D22';
const FADE_ONE = 'linear-gradient(0deg,rgba(6,8,6,.85) 0%,rgba(6,8,6,.3) 45%,rgba(6,8,6,0) 70%)';
const FADE = 'linear-gradient(0deg,rgba(6,8,6,.82) 0%,rgba(6,8,6,.35) 38%,rgba(6,8,6,0) 62%)';
const PILL: React.CSSProperties = { position: 'absolute', background: 'rgba(10,10,12,.5)', WebkitBackdropFilter: 'blur(10px)', backdropFilter: 'blur(10px)', borderRadius: 999, color: '#FFFFFF', fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2, fontVariantNumeric: 'tabular-nums' };
const LINE: React.CSSProperties = { display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 };

/** Signed-off mock geometry in mock units, per format. */
const SPEC = {
  story: { k: 405 / 300, h: 720, pad: [22, 16, 18], kicker: 9, blockTop: 14, oneH: 104, oneRank: 32, onePill: 10, oneName: 12.5, oneLoc: 9, tileH: null as number | null, rank: 15, pill: 8.5, name: 8.5, loc: 7, avatar: 28, avatarR: 10, wordmark: 17 },
  post: { k: 405 / 320, h: 506, pad: [16, 16, 14], kicker: 8.5, blockTop: 12, oneH: 84, oneRank: 28, onePill: 9.5, oneName: 12, oneLoc: 8.5, tileH: 66 as number | null, rank: 14, pill: 8, name: 8.5, loc: 7, avatar: 24, avatarR: 8, wordmark: 15 },
};

export const heroLocation = (c: TopTenShareCourse) => [c.region, c.sub_country || c.country].filter(Boolean).join(' · ');
export const tileCounty = (c: TopTenShareCourse) => c.region || c.sub_country || c.country || '';

export function shareStatLine(identity: TopTenShareCardIdentity, courses: TopTenShareCourse[], showHandicap: boolean, t: (k: string, o: Record<string, unknown>) => string) {
  const countries = new Set(courses.map(c => c.sub_country || c.country).filter(Boolean) as string[]).size;
  const parts: string[] = [];
  if (showHandicap && identity.handicapIndex != null) parts.push(t('topTen.share.hcp', { value: identity.handicapIndex.toFixed(1), defaultValue: '{{value}} HCP' }));
  if (identity.rounds != null) parts.push(t('topTen.share.rounds', { count: identity.rounds, defaultValue: '{{count}} rounds' }));
  if (identity.rated != null) parts.push(t('topTen.share.rated', { count: identity.rated, defaultValue: '{{count}} rated' }));
  if (countries > 0) parts.push(t('topTen.share.countries', { count: countries, defaultValue: '{{count}} countries' }));
  return parts.join(' · ');
}

export const TopTenShareCard: React.FC<Props> = ({ format, courses, identity, showHandicap, photos }) => {
  const { t } = useTranslation('profile');
  const story = format === 'story';
  const s = SPEC[format];
  const u = (n: number) => Math.round(n * s.k * 100) / 100;
  const byPosition = new Map(courses.map(c => [c.position, c]));
  const firstName = identity.firstName?.trim() || identity.displayName.trim().split(/\s+/)[0] || '';
  const statLine = shareStatLine(identity, courses, showHandicap, t as never);

  const tile = (position: number) => {
    const one = position === 1;
    const c = byPosition.get(position);
    const size: React.CSSProperties = one ? { gridColumn: '1 / -1', height: u(s.oneH) } : s.tileH ? { height: u(s.tileH) } : { aspectRatio: '1 / 1' };
    const rank: React.CSSProperties = { position: 'absolute', left: u(one ? 10 : 7), top: u(one ? 8 : 5), fontSize: u(one ? s.oneRank : s.rank), fontWeight: 700, letterSpacing: '-0.04em', lineHeight: 1 };
    if (!c) return <div key={position} data-share-tile={position} data-share-empty style={{ position: 'relative', overflow: 'hidden', background: EMPTY, ...size }}><span style={{ ...rank, color: 'rgba(248,250,252,.28)' }}>{position}</span></div>;
    const photo = photos[position - 1] ?? null;
    return <div key={position} data-share-tile={position} style={{ position: 'relative', overflow: 'hidden', ...size, ...(photo ? {} : { background: gradientForCourse(c.course_id) }) }}>
      {photo
        ? <img data-share-photo src={photo} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        : <span data-share-fallback style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(one ? 22 : 13), fontWeight: 700, letterSpacing: '0.04em', color: 'rgba(248,250,252,0.42)' }}>{initialsForCourse(c.name)}</span>}
      <span style={{ position: 'absolute', inset: 0, background: one ? FADE_ONE : FADE }} />
      <span style={{ ...rank, color: '#FFFFFF' }}>{position}</span>
      {c.rating != null && <span data-share-pill style={{ ...PILL, right: u(one ? 8 : 6), top: u(one ? 8 : 6), fontSize: u(one ? s.onePill : s.pill), padding: one ? `${u(2)}px ${u(7)}px` : `${u(2)}px ${u(6)}px` }}>{c.rating.toFixed(1)}</span>}
      <span style={{ position: 'absolute', left: u(one ? 10 : 7), right: u(one ? 10 : 7), bottom: u(one ? 8 : 6), color: '#FFFFFF' }}>
        <span data-share-name style={{ ...LINE, fontSize: u(one ? s.oneName : s.name), fontWeight: 700 }}>{c.name}</span>
        <span style={{ ...LINE, marginTop: u(1), fontSize: u(one ? s.oneLoc : s.loc), fontWeight: 600, color: LOC }}>{one ? heroLocation(c) : tileCounty(c)}</span>
      </span>
    </div>;
  };

  return <div data-share-card={format} style={{ width: 405, height: s.h, overflow: 'hidden', position: 'relative', background: CANVAS, color: INK, fontFamily: FONT, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: `${u(s.pad[0])}px ${u(s.pad[1])}px ${u(s.pad[2])}px`, fontVariantNumeric: 'tabular-nums' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <img data-share-wordmark src={wordmarkWhite.url} alt="clbhouz" style={{ display: 'block', height: s.wordmark, width: 'auto' }} />
      <span style={{ fontSize: u(s.kicker), fontWeight: 700, letterSpacing: '.18em', textTransform: 'uppercase', lineHeight: 1, color: INK }}>{t('topTen.share.cardTitle', 'My top 10')}</span>
    </div>
    {story && <div data-share-title style={{ marginTop: u(20), fontSize: u(21), fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.05, color: INK }}>{`${firstName}'s top ten courses`}</div>}
    <div data-share-block style={{ marginTop: u(s.blockTop), borderRadius: u(14), overflow: 'hidden', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 2, background: CANVAS }}>
      {Array.from({ length: 10 }, (_, i) => tile(i + 1))}
    </div>
    <div style={{ flex: 1 }} />
    <div style={{ display: 'flex', alignItems: 'center', gap: u(9), minWidth: 0 }}>
      <span style={{ width: u(s.avatar), height: u(s.avatar), flexShrink: 0, borderRadius: u(s.avatarR), background: AVATAR_FALLBACK, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: u(9), fontWeight: 700, color: INK }}>
        {identity.avatarUrl ? <img src={identity.avatarUrl} crossOrigin="anonymous" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /> : getInitialsFromName(identity.displayName)}
      </span>
      <div style={{ minWidth: 0 }}>
        <div style={{ ...LINE, fontSize: u(11.5), fontWeight: 700, color: INK }}>{identity.displayName}</div>
        <div data-share-stats style={{ ...LINE, marginTop: u(2), fontSize: u(9), fontWeight: 600, color: STAT }}>{statLine}</div>
      </div>
    </div>
  </div>;
};
export default TopTenShareCard;
