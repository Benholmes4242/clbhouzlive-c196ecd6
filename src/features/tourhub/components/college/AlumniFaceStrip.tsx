/**
 * AlumniFaceStrip - Horizontal strip of alumni headshots.
 * Overlaps the hero by 20px. bg-card, rounded-2xl, border.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPlayerHeadshotUrl, PLAYER_SILHOUETTE_URL } from '@/utils/playerHeadshot';
import type { AlumniFace } from '../../hooks/useBatchCollegeAlumni';

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0]?.slice(0, 2).toUpperCase() || '?';
}

interface AlumniFaceStripProps {
  alumni: AlumniFace[];
  collegeName: string;
  collegeSlug: string;
  totalAlumniCount: number;
  className?: string;
}

const MAX_VISIBLE = 5;

export function AlumniFaceStrip({ alumni, collegeName, collegeSlug, totalAlumniCount, className }: AlumniFaceStripProps) {
  if (!alumni.length) return null;

  const visible = alumni.slice(0, MAX_VISIBLE);
  const overflow = totalAlumniCount - MAX_VISIBLE;
  const namePreview = visible
    .map(a => a.full_name.split(' ').pop())
    .slice(0, 4)
    .join(', ');

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4 }}
      className={cn('px-4', className)}
      style={{ marginTop: -20 }}
    >
      <Link
        to={`/tourhub/college-golf/${collegeSlug}`}
        className="flex items-center gap-3 active:scale-[0.99] transition-all duration-200 group"
        style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border) / 0.5)',
          borderRadius: 16,
          padding: '12px 16px',
        }}
      >
        {/* Stacked circular avatars — 32×32, 50% radius, 2px white border, -8px overlap */}
        <div className="flex items-center shrink-0" style={{ marginLeft: 0 }}>
          {visible.map((alum, i) => {
            const photoUrl = getPlayerHeadshotUrl(alum.full_name, 'pga');
            return (
              <div
                key={alum.id}
                className="bg-muted overflow-hidden"
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '2px solid white',
                  marginLeft: i === 0 ? 0 : -8,
                  zIndex: MAX_VISIBLE - i,
                  position: 'relative',
                }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={alum.full_name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <span className="text-[8px] font-bold text-muted-foreground/70">
                      {getInitials(alum.full_name)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {overflow > 0 && (
            <div
              className="bg-muted flex items-center justify-center"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '2px solid white',
                marginLeft: -8,
                position: 'relative',
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 600 }} className="text-muted-foreground">
                +{overflow}
              </span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p style={{ fontSize: 13, fontWeight: 500 }} className="text-foreground truncate">
            {namePreview} …
          </p>
          <p style={{ fontSize: 11, fontWeight: 400 }} className="text-muted-foreground mt-0.5">
            {totalAlumniCount} alumni on tour this season
          </p>
        </div>

        <ChevronRight className="w-4 h-4 shrink-0" style={{ color: 'hsl(var(--muted-foreground) / 0.3)' }} />
      </Link>
    </motion.div>
  );
}
