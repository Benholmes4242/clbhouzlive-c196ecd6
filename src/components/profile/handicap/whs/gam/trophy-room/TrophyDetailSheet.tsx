import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GamSheet } from '../../../gam/_shared/GamSheet';
import { DetailHero } from './parts/DetailHero';
import { AchievementBody } from './parts/AchievementBody';
import { LegendBody } from './parts/LegendBody';
import { DetailFooter } from './parts/DetailFooter';
import type { TrophyItem } from './_shared/normalizeTrophyItem';

interface Props {
  items: TrophyItem[];
  initialIndex: number;
  viewerUserId: string;
  onClose: () => void;
}

/**
 * Stacked detail sheet — opens on top of TrophyRoomSheet.
 * Horizontal swipe paginates through the same-group `items`.
 */
export const TrophyDetailSheet: React.FC<Props> = ({ items, initialIndex, viewerUserId, onClose }) => {
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
    const text =
      current.kind === 'legend'
        ? `I hold the #${current.rank} ${current.name} at ${current.courseName} on clbhouz`
        : `I earned ${current.name} on clbhouz`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ title: current.kind === 'legend' ? current.name : current.name, text }).catch(() => {});
    }
  };

  const handleOpenCourse = () => {
    if (current.kind !== 'legend') return;
    const courseId = current.courseId;
    onClose();
    setTimeout(() => navigate(`/courses/${courseId}`), 100);
  };

  return (
    <GamSheet open onClose={onClose}>
      <DetailHero
        item={current}
        index={index}
        total={items.length}
        onPrev={canPrev ? goPrev : null}
        onNext={canNext ? goNext : null}
        onClose={onClose}
      />
      <div
        ref={scrollRef}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', willChange: 'transform' }}
      >
        {current.kind === 'achievement' ? (
          <AchievementBody item={current} viewerUserId={viewerUserId} />
        ) : (
          <LegendBody item={current} viewerUserId={viewerUserId} onNavigateClose={onClose} />
        )}
      </div>
      <DetailFooter item={current} onShare={handleShare} onOpenCourse={handleOpenCourse} />
    </GamSheet>
  );
};

export default TrophyDetailSheet;
