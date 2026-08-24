import { useTranslation } from 'react-i18next';
import { Plus, MapPin, MapPinPlus, Zap, Bell } from 'lucide-react';
import { openRequestCourseSheet } from './requestCourseSheetStore';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface RequestCourseCTAProps {
  prefillName?: string;
  variant?: 'button' | 'row' | 'hero';
  /**
   * Surface the CTA sits on. 'dark' is used by the global search overlay
   * (BRIEF_SEARCH_OVERLAY_DARK §4); CourseSearchSheet is still a light
   * surface, so the light hero is retained rather than deleted.
   */
  tone?: 'light' | 'dark';
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
  tone = 'light',
}: RequestCourseCTAProps) {
  const dark = tone === 'dark';
  const { t } = useTranslation('courses');
  const handleOpen = () => {
    onBeforeOpen?.();
    // Defer a tick so any parent close animations can start cleanly first
    setTimeout(() => openRequestCourseSheet(prefillName), 0);
  };

  if (variant === 'hero') {
    const q = (prefillName ?? '').trim();
    const headline = q ? t('request.hero.headlineWithQuery', { query: truncate(q) }) : t('request.hero.headline');
    return (
      <div
        className={`mx-auto w-full overflow-hidden rounded-2xl ${className}`}
        style={{
          maxWidth: 340,
          background: dark ? A.PANEL : '#FFFFFF',
          border: `1px solid ${dark ? A.BORDER : 'hsl(var(--border) / 0.6)'}`,
        }}
      >
        {/* Top amber band */}
        <div
          style={{
            background: dark ? 'rgba(247,147,30,0.12)' : HERO_BAND_BG,
            padding: '24px 20px 20px',
            textAlign: 'center',
          }}
        >
          <div
            className="mx-auto flex items-center justify-center"
            style={{
              width: 52,
              height: 52,
              borderRadius: 15,
              background: dark ? 'rgba(255,255,255,0.10)' : '#fff',
              marginBottom: 12,
            }}
          >
            <MapPinPlus size={26} color={HERO_ACCENT} strokeWidth={2.25} />
          </div>
          <p
            style={{
              fontSize: 17,
              fontWeight: 500,
              color: dark ? A.INK : HERO_HEADLINE,
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
              color: dark ? A.MUTE : HERO_SUBTEXT,
              lineHeight: 1.5,
              maxWidth: 260,
              marginTop: 6,
            }}
          >
            {t('request.hero.body')}
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          <div className="flex flex-col gap-2.5 mb-4">
            <div className="flex items-center gap-2.5">
              <Zap size={17} color={HERO_ACCENT} strokeWidth={2.25} />
              <span className="text-[13px]" style={{ color: dark ? A.MUTE : undefined }}>
                {t('request.hero.perkQuick')}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Bell size={17} color={HERO_ACCENT} strokeWidth={2.25} />
              <span className="text-[13px]" style={{ color: dark ? A.MUTE : undefined }}>
                {t('request.hero.perkNotify')}
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
            {t('request.hero.cta')}
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
        {t('request.buttonCta')}
      </button>
    );
  }

  // Row variant — matches the course rows in SearchOverlayV2
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
          {t('request.row.title')}
        </p>
        <p className="text-[12px] truncate" style={{ color: INK_SOFT }}>
          {t('request.row.subtitle')}
        </p>
      </div>
    </button>
  );
}

export default RequestCourseCTA;
