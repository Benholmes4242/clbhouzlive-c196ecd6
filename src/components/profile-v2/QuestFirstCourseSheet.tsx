/**
 * QuestFirstCourseSheet - Special one-time sheet for first course played
 * "The Quest Begins" moment
 */

import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MapPin } from 'lucide-react';

interface QuestFirstCourseSheetProps {
  open: boolean;
  onClose: () => void;
  courseName?: string;
}

export const QuestFirstCourseSheet: React.FC<QuestFirstCourseSheetProps> = ({
  open,
  onClose,
  courseName,
}) => {
  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t"
        style={{
          background: 'var(--dgp-bg-surface)',
          borderColor: 'var(--dgp-glass-stroke)',
        }}
      >
        <div className="text-center py-8 px-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: 'rgba(110, 146, 119, 0.15)',
                border: '1px solid var(--dgp-accent-green)',
                boxShadow: '0 0 30px rgba(110, 146, 119, 0.2)',
              }}
            >
              <MapPin className="w-7 h-7" style={{ color: 'var(--dgp-accent-green)' }} />
            </div>
          </div>

          {/* Title */}
          <h2
            className="text-2xl font-bold mb-3"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            The Quest Begins
          </h2>

          {/* Body */}
          <p
            className="text-sm mb-2"
            style={{ color: 'var(--dgp-text-secondary)' }}
          >
            Every journey starts with the first course.
          </p>

          {courseName && (
            <p
              className="text-xs mb-6"
              style={{ color: 'var(--dgp-accent-gold)' }}
            >
              {courseName}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full max-w-xs py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98]"
            style={{
              background: 'var(--dgp-accent-green)',
              color: '#fff',
            }}
          >
            Continue
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuestFirstCourseSheet;
