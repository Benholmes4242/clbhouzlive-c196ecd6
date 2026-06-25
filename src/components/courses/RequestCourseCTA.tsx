import { Plus, MapPin, MapPinPlus, Zap, Bell } from 'lucide-react';
import { openRequestCourseSheet } from './requestCourseSheetStore';

interface RequestCourseCTAProps {
  prefillName?: string;
  variant?: 'button' | 'row' | 'hero';
  className?: string;
  /** Called immediately before the sheet opens — use to close the parent overlay/sheet. */
  onBeforeOpen?: () => void;
}

const INK = '#0F172A';
const INK_SOFT = '#475569';
const AMBER = '#F7931E';

// Hero palette (amber ramp)
const HERO_BAND_BG = '#FAEEDA';
const HERO_HEADLINE = '#633806';
const HERO_SUBTEXT = '#854F0B';
const HERO_ACCENT = '#BA7517';

function truncate(s: string, max = 24) {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).trimEnd() + '…';
}

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

  if (variant === 'hero') {
    const q = (prefillName ?? '').trim();
    const headline = q ? `Can't find "${truncate(q)}"?` : `Can't find a course?`;
    return (
      <div
        className={`mx-auto w-full overflow-hidden rounded-2xl border border-border/60 bg-white ${className}`}
        style={{ maxWidth: 340 }}
      >
        {/* Top amber band */}
        <div
          style={{
            background: HERO_BAND_BG,
            padding: '22px 20px 20px',
            textAlign: 'center',
          }}
        >
          <div
            className="mx-auto flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              background: '#fff',
              marginBottom: 14,
            }}
          >
            <MapPinPlus size={26} color={HERO_ACCENT} strokeWidth={2.25} />
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: HERO_HEADLINE,
              lineHeight: 1.3,
              margin: 0,
            }}
          >
            {headline}
          </p>
          <p
            className="mx-auto"
            style={{
              fontSize: 13,
              color: HERO_SUBTEXT,
              lineHeight: 1.5,
              maxWidth: 260,
              marginTop: 6,
            }}
          >
            If a course is missing, tell us and we'll add it to the map.
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px 18px' }}>
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Zap size={17} color={HERO_ACCENT} strokeWidth={2.25} />
              <span className="text-[13px] text-muted-foreground">
                Takes 20 seconds — just name and location
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bell size={17} color={HERO_ACCENT} strokeWidth={2.25} />
              <span className="text-[13px] text-muted-foreground">
                We'll notify you the moment it's live
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpen}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-[12px] active:opacity-90 transition-opacity"
            style={{
              height: 46,
              background: AMBER,
              color: '#fff',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            <Plus size={18} color="#fff" strokeWidth={2.5} />
            Request this course
          </button>
        </div>
      </div>
    );
  }

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
          Still not the one? Tap to request it.
        </p>
      </div>
    </button>
  );
}

export default RequestCourseCTA;
