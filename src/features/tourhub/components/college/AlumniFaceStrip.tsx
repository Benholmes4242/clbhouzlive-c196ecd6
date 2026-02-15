/**
 * AlumniFaceStrip - Horizontal strip of alumni headshots.
 * Overlaps the hero by 20px for visual impact.
 * Tappable → navigates to the college detail page.
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolvePhotoUrl } from '../../utils/resolvePhotoUrl';
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
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-2xl',
          'bg-card/90 backdrop-blur-xl',
          'border border-border/40',
          'shadow-lg shadow-black/5',
          'hover:border-primary/30 transition-all duration-200',
          'active:scale-[0.99] group'
        )}
      >
        {/* Stacked headshots — squircle with 1px neutral border */}
        <div className="flex items-center -space-x-2.5 shrink-0">
          {visible.map((alum, i) => {
            const photoUrl = resolvePhotoUrl(alum.photo_url, alum.pga_tour_id);
            return (
              <div
                key={alum.id}
                className="w-9 overflow-hidden bg-muted shadow-sm"
                style={{ zIndex: MAX_VISIBLE - i, borderRadius: '34%', aspectRatio: '1 / 1.05', border: '1px solid #D1D5DB' }}
              >
                {photoUrl ? (
                  <img
                    src={photoUrl}
                    alt={alum.full_name}
                    className="w-full h-full object-cover object-top"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/30 flex items-center justify-center">
                    <span className="text-[9px] font-bold text-muted-foreground/70 leading-none">
                      {getInitials(alum.full_name)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
          {overflow > 0 && (
            <div className="w-9 bg-muted flex items-center justify-center shadow-sm" style={{ borderRadius: '34%', aspectRatio: '1 / 1.05', border: '1px solid #D1D5DB' }}>
              <span className="text-[10px] font-bold text-muted-foreground">
                +{overflow}
              </span>
            </div>
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground truncate">
            {namePreview} …
          </p>
          <p className="text-[11px] text-muted-foreground/60 mt-0.5">
            {totalAlumniCount} alumni on tour this season
          </p>
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
      </Link>
    </motion.div>
  );
}
