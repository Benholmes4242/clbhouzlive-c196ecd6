import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AchievementImmersive } from './parts/AchievementImmersive';
import { LegendImmersive } from './parts/LegendImmersive';
import { Top100Immersive } from './parts/Top100Immersive';
import { isTop100Achievement } from './_shared/showpieces';
import type { TrophyItem } from './_shared/normalizeTrophyItem';

interface Props {
  items: TrophyItem[];
  initialIndex: number;
  /** The user whose Trophy Room is open (collection owner) */
  ownerUserId: string;
  /** The currently-logged-in user (may equal ownerUserId for self-view) */
  viewerUserId: string;
  onClose: () => void;
}

/**
 * Stacked detail sheet — opens on top of TrophyRoomSheet.
 * Horizontal swipe paginates through the same-group `items`.
 */
export const TrophyDetailSheet: React.FC<Props> = ({ items, initialIndex, ownerUserId, viewerUserId, onClose }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(Math.max(0, Math.min(initialIndex, items.length - 1)));
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [index]);

  const current = items[index];
  if (!current) return null;

  const canPrev = index > 0;
  const canNext = index < items.length - 1;

  const goPrev = () => canPrev && setIndex((i) => i - 1);
  const goNext = () => canNext && setIndex((i) => i + 1);

  // Horizontal swipe handlers
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) >= 60 && Math.abs(dy) < 30) {
      if (dx < 0 && canNext) goNext();
      else if (dx > 0 && canPrev) goPrev();
    }
  };

  const handleShare = () => {
    const text = (() => {
      if (current.kind === 'legend') {
        return `I hold the #${current.rank} ${current.name} at ${current.courseName} on clbhouz`;
      }
      if (isTop100Achievement(current.badgeId)) {
        const count = current.currentValue ?? 0;
        const SHORT_LABEL: Record<string, string> = {
          top_100_worldwide: 'Worldwide',
          top_100_usa: 'USA',
          top_100_gbni: 'GB&I',
          top_100_europe: 'Continental Europe',
        };
        const label = SHORT_LABEL[current.badgeId] ?? current.name;
        if (count === 0) return `I'm on the ${label} Top 100 journey on clbhouz`;
        if (count === 1) return `I've played 1 of 100 ${label} Top 100 courses on clbhouz`;
        if (count === 100) return `I've played the full ${label} Top 100 on clbhouz`;
        return `I've played ${count} of 100 ${label} Top 100 courses on clbhouz`;
      }
      return `I earned ${current.name} on clbhouz`;
    })();
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: current.name, text }).catch(() => {});
    }
  };

  const handleOpenCourse = () => {
    if (current.kind !== 'legend') return;
    const courseId = current.courseId;
    onClose();
    setTimeout(() => navigate(`/courses/${courseId}`), 100);
  };

  // Non-Top-100 achievement badges render as a minimal immersive overlay
  // instead of the sheet flow. Top-100 badges and legend rows keep the sheet.
  if (current.kind === 'achievement' && !isTop100Achievement(current.badgeId)) {
    return (
      <AchievementImmersive
        item={current}
        viewerUserId={viewerUserId}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  if (current.kind === 'legend') {
    return (
      <LegendImmersive
        item={current}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  // Top-100 achievement: last flow moved off the sheet.
  if (current.kind === 'achievement' && isTop100Achievement(current.badgeId)) {
    return (
      <Top100Immersive
        item={current}
        ownerUserId={ownerUserId}
        viewerUserId={viewerUserId}
        onClose={onClose}
        onShare={handleShare}
      />
    );
  }

  return null;
};

export default TrophyDetailSheet;
