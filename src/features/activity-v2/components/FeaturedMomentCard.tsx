import React from 'react';
import { Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ActivityFeedRowV2 } from '../hooks/useActivityFeedV2';

const SF_STACK =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
import { A } from '@/features/courses/components/holes/analytical/tokens';

const AMBER = '#F7931E';
/**
 * BRIEF_ACTIVITY_PAGE_DARK §3 — OPTION (b). This card's whole job was to stand
 * out by INVERTING: a near-black card on a white page. On the dark page that
 * inversion stops working — it is not illegible, it is invisible AS A CARD. It
 * keeps a distinct ground, but one that now reads AGAINST dark: a RAISED panel,
 * one clear step lighter than the canvas, plus an amber-tinted edge to hold the
 * "while you were away" prominence. Option (c), the one light card, would fight
 * everything else the app now does.
 */
const CARD_TOP = '#262B37';
const CARD_MID = '#1F232E';
const CARD_END = '#1B1E27';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Client-side selection: page-1 rows only.
 * Candidate = first row that is a 'like', unread, within 7 days,
 * and has like_count >= 5.
 */
export function pickFeaturedRow(rows: ActivityFeedRowV2[]): ActivityFeedRowV2 | null {
  const now = Date.now();
  for (const r of rows) {
    if (r.notif_type !== 'like') continue;
    if (r.is_read) continue;
    const likeCount = Number(r.data?.like_count ?? 0);
    if (!(likeCount >= 5)) continue;
    const ts = new Date(r.created_at).getTime();
    if (!Number.isFinite(ts) || now - ts > SEVEN_DAYS_MS) continue;
    return r;
  }
  return null;
}

interface Props {
  row: ActivityFeedRowV2;
}

function initialsOf(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

export const FeaturedMomentCard: React.FC<Props> = ({ row }) => {
  const navigate = useNavigate();

  const likeCount = Number(row.data?.like_count ?? 0);
  const isVideoTarget = !!row.target_poster_url;
  const kicker = isVideoTarget ? 'YOUR CLIP IS TRENDING' : 'YOUR POST IS TRENDING';
  const ctaLabel = isVideoTarget ? 'Watch' : 'View';
  const target = row.target_course_name?.trim() || 'your post';
  const headline = `${likeCount} likes on ${target}`;

  const avatars: string[] = Array.isArray(row.liker_avatar_urls)
    ? (row.liker_avatar_urls as string[]).filter(Boolean).slice(0, 4)
    : [];
  const names: string[] = Array.isArray(row.data?.recent_liker_names)
    ? (row.data.recent_liker_names as string[]).filter(Boolean)
    : [];

  const firstName = names[0] ?? 'Someone';
  const othersCount = Math.max(likeCount - 1, 0);
  const nameLine =
    othersCount > 0 ? `${firstName} and ${othersCount} others` : firstName;

  const handleOpen = () => {
    if (row.entity_type === 'post' && row.entity_id) {
      navigate(`/post/${row.entity_id}`);
    }
  };

  return (
    <div style={{ padding: '18px 16px 4px', fontFamily: SF_STACK }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(248,250,252,0.62)',
          marginBottom: 10,
        }}
      >
        While you were away
      </div>
      <div
        onClick={handleOpen}
        role="button"
        tabIndex={0}
        style={{
          background: `linear-gradient(160deg,${CARD_TOP} 0%,${CARD_MID} 60%,${CARD_END} 100%)`,
          borderRadius: 18,
          padding: '16px 16px 14px',
          color: A.INK,
          cursor: 'pointer',
          border: '1px solid rgba(247,147,30,0.22)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: 'rgba(247,147,30,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Flame size={16} color={AMBER} strokeWidth={2.5} />
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.72)',
            }}
          >
            {kicker}
          </div>
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
            marginBottom: 12,
          }}
        >
          {headline}
        </div>

        {(avatars.length > 0 || names.length > 0) && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex' }}>
              {(avatars.length > 0 ? avatars : names.slice(0, 4)).map((val, i) => {
                const isUrl = avatars.length > 0;
                return (
                  <div
                    key={`${val}-${i}`}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '34%',
                      background: isUrl ? 'rgba(255,255,255,0.10)' : 'rgba(247,147,30,0.25)',
                      backgroundImage: isUrl ? `url(${val})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      // §3 :154 was a near-black ring on a near-black card: it is the
            // facepile's CUT-OUT, separating overlapping avatars by painting the
            // card's own ground between them. It therefore tracks the card
            // ground, and follows it to the raised panel.
            border: `1.5px solid ${CARD_MID}`,
                      marginLeft: i === 0 ? 0 : -8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: A.INK,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    {!isUrl ? initialsOf(String(val)) : null}
                  </div>
                );
              })}
            </div>
            <div
              style={{
                marginLeft: 10,
                fontSize: 12.5,
                fontWeight: 600,
                color: 'rgba(255,255,255,0.72)',
              }}
            >
              {nameLine}
            </div>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleOpen();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '8px 14px',
            borderRadius: 30,
            background: AMBER,
            // Label ON the amber fill: near-black canvas, not white (§2.2).
            color: A.CANVAS,
            fontSize: 13,
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            fontFamily: SF_STACK,
          }}
        >
          {ctaLabel} ›
        </button>
      </div>
    </div>
  );
};

export default FeaturedMomentCard;
