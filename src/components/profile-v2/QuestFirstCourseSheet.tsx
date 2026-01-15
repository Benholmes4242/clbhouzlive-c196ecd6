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
        className="rounded-t-3xl border-t border-[#e2e8f0] bg-white"
      >
        {/* Handle bar */}
        <div className="w-10 h-1 bg-[#e2e8f0] rounded-full mx-auto mb-4" />
        
        <div className="text-center py-6 px-4">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center bg-emerald-50 border border-emerald-200"
              style={{
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.15)',
              }}
            >
              <MapPin className="w-7 h-7 text-emerald-600" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-3 text-[#1e293b]">
            The Quest Begins
          </h2>

          {/* Body */}
          <p className="text-sm mb-2 text-[#64748b]">
            Every journey starts with the first course.
          </p>

          {courseName && (
            <p className="text-xs mb-6 text-amber-600">
              {courseName}
            </p>
          )}

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full max-w-xs py-3.5 rounded-xl font-medium text-sm transition-all duration-200 active:scale-[0.98] bg-[#1e293b] text-white hover:bg-[#334155]"
          >
            Continue
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default QuestFirstCourseSheet;
