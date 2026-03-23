import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useCourseCardData } from '../hooks/useCourseCardData';
import { useCoursePlayedState } from '../hooks/useCoursePlayedState';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

interface CourseDNACardProps {
  courseId: string;
  courseName: string;
  courseCountry: string;
  mapboxToken: string;
  onNavigate: () => void;
}

export function CourseDNACard({ courseId, courseName, courseCountry, mapboxToken, onNavigate }: CourseDNACardProps) {
  const { user } = useSupabaseSession();
  const { data: courseData } = useCourseCardData(courseId, true);
  const { isPlayed, isBucket, togglePlayed, toggleBucket } = useCoursePlayedState(courseId, user?.id);

  const mapUrl = courseData?.latitude && courseData?.longitude
    ? `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${courseData.longitude},${courseData.latitude},14,0/320x90@2x?access_token=${mapboxToken}`
    : courseData?.thumbnailImage || null;

  const rank = courseData?.globalRank;
  const region = courseData?.subCountry || courseData?.region || courseCountry;
  const hasHostedMajor = courseData?.hasHostedMajor;

  return (
    <div
      onClick={(e) => { e.stopPropagation(); onNavigate(); }}
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.06)',
        border: '0.5px solid rgba(255,255,255,0.1)',
        cursor: 'pointer',
      }}
    >
      {/* Map / thumbnail strip */}
      <div style={{ position: 'relative', height: 80, overflow: 'hidden' }}>
        {mapUrl && (
          <img
            src={mapUrl}
            alt={courseName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
           loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              const fallback = courseData?.thumbnailImage;
              if (fallback && img.src !== fallback) {
                img.src = fallback;
              } else {
                img.style.display = 'none';
              }
            }}
          />
        )}
        {/* Gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
        }} />

        {/* Rank badge top-right */}
        {rank && (
          <div style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '2px 6px',
            fontSize: 10, fontWeight: 700, color: '#F59E0B',
            letterSpacing: '0.02em',
          }}>
            #{rank} World
          </div>
        )}

        {/* Major venue badge */}
        {hasHostedMajor && (
          <div style={{
            position: 'absolute', top: 6, left: 6,
            background: 'rgba(0,0,0,0.65)',
            backdropFilter: 'blur(8px)',
            borderRadius: 6, padding: '2px 6px',
            fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
            letterSpacing: '0.03em', textTransform: 'uppercase' as const,
          }}>
            Major venue
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '8px 10px 10px' }}>
        {/* Course name + chevron */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 4, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.95)',
              lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {courseName}
            </div>
            <div style={{
              fontSize: 11, color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.3, marginTop: 1,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
            }}>
              {region}
            </div>
          </div>
          <ChevronRight style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0, marginTop: 2 }} />
        </div>

        {/* Stats chips — only render non-null values, max 3 */}
        {(() => {
          const stats: { label: string; value: string }[] = [];
          if (courseData?.courseType) {
            const label = courseData.courseType.charAt(0).toUpperCase() + courseData.courseType.slice(1);
            stats.push({ label: 'Type', value: label });
          }
          if (courseData?.globalRank) {
            stats.push({ label: 'World', value: `#${courseData.globalRank}` });
          }
          if (courseData?.countryRank) {
            stats.push({ label: region, value: `#${courseData.countryRank}` });
          }
          if (courseData?.majorChampionships?.length) {
            stats.push({ label: 'Majors', value: `${courseData.majorChampionships.length}` });
          }
          const visible = stats.slice(0, 3);
          if (!visible.length) return null;
          return (
            <div style={{ display: 'flex', gap: 5, marginBottom: 8 }}>
              {visible.map((s) => (
                <div key={s.label} style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.05)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 7,
                  padding: '4px 6px',
                  textAlign: 'center' as const,
                }}>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 2 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Played / Bucket list toggles */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); togglePlayed(); }}
            style={{
              flex: 1, minWidth: 0, whiteSpace: 'nowrap' as const, padding: '0 10px',
              height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: isPlayed ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
              color: isPlayed ? '#F59E0B' : 'rgba(255,255,255,0.5)',
              border: isPlayed ? '0.5px solid rgba(245,158,11,0.4)' : '0.5px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Played
          </button>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleBucket(); }}
            style={{
              flex: 1, height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              background: isBucket ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)',
              color: isBucket ? '#F87171' : 'rgba(255,255,255,0.5)',
              border: isBucket ? '0.5px solid rgba(239,68,68,0.35)' : '0.5px solid rgba(255,255,255,0.1)',
              transition: 'all 0.15s',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isBucket ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Bucket list
          </button>
        </div>
      </div>
    </div>
  );
}
