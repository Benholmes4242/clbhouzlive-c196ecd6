import { Plus, MapPin } from 'lucide-react';
import { openRequestCourseSheet } from './requestCourseSheetStore';

interface RequestCourseCTAProps {
  prefillName?: string;
  variant?: 'button' | 'row';
  className?: string;
  /** Called immediately before the sheet opens — use to close the parent overlay/sheet. */
  onBeforeOpen?: () => void;
}

const INK = '#0F172A';
const INK_SOFT = '#475569';
const AMBER = '#F7931E';

export function RequestCourseCTA({
  prefillName,
  variant = 'button',
  className = '',
  onBeforeOpen,
}: RequestCourseCTAProps) {
  const handleOpen = () => {
    onBeforeOpen?.();
    // Defer a tick so any parent close animations can start cleanly first
    setTimeout(() => openRequestCourseSheet(prefillName), 0);
  };

  if (variant === 'button') {
    return (
      <button
        type="button"
        onClick={handleOpen}
        className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-[12px] border border-slate-200 bg-white text-[14px] font-semibold text-slate-900 active:bg-slate-50 ${className}`}
      >
        <Plus size={18} color={AMBER} strokeWidth={2.5} />
        Request a course
      </button>
    );
  }

  // Row variant — matches the course rows in GlobalSearchOverlay
  return (
    <button
      type="button"
      onClick={handleOpen}
      className={`w-full flex items-center gap-3 px-4 min-h-[56px] active:bg-black/[0.02] text-left ${className}`}
    >
      <div
        className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: 'rgba(247,147,30,0.12)' }}
      >
        <MapPin size={20} color={AMBER} strokeWidth={2.25} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate" style={{ color: INK }}>
          Request a course
        </p>
        <p className="text-[12px] truncate" style={{ color: INK_SOFT }}>
          Can't find it? Tap to request it.
        </p>
      </div>
    </button>
  );
}

export default RequestCourseCTA;
