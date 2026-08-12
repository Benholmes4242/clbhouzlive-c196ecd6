import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { TITLE } from '@/lib/tokens/type';
import { supabase } from '@/integrations/supabase/client';

interface RequestCourseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillName?: string;
  zIndexBase?: number;
}

type Status = 'form' | 'submitting' | 'success';

export function RequestCourseSheet({ open, onOpenChange, prefillName, zIndexBase = 10300 }: RequestCourseSheetProps) {
  const { t } = useTranslation('courses');
  const [status, setStatus] = useState<Status>('form');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>(t('request.sheet.successBody'));

  // Reset on open
  useEffect(() => {
    if (open) {
      setStatus('form');
      setName(prefillName ?? '');
      setLocation('');
      setNote('');
      setError(null);
      setSuccessMessage(t('request.sheet.successBody'));
    }
  }, [open, prefillName, t]);

  const canSubmit = name.trim().length > 0 && location.trim().length > 0 && status !== 'submitting';

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus('submitting');
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('request-course', {
        body: {
          course_name: name.trim(),
          location: location.trim(),
          note: note.trim() || undefined,
        },
      });
      if (invokeError) throw invokeError;
      if (data?.ok) {
        if (data.duplicate && data.message) {
          setSuccessMessage(data.message);
        }
        setStatus('success');
      } else {
        throw new Error(data?.message || t('request.sheet.error'));
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : undefined;
      setError(msg || t('request.sheet.error'));
      setStatus('form');
    }
  };

  const close = () => onOpenChange(false);

  const labelCls = 'block text-[13px] font-medium text-slate-700 mb-1.5';
  const inputCls =
    'w-full h-11 px-3 rounded-[10px] border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 focus:border-[#F7931E]';

  return (
    <BottomSheet open={open} onClose={close} ariaLabelledBy="request-course-title" zIndexBase={zIndexBase}>
      <div className="px-5 pt-2 pb-4">
        {status === 'success' ? (
          <div className="flex flex-col items-center text-center pt-6 pb-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(247,147,30,0.12)' }}
            >
              <Check size={28} color="#F7931E" strokeWidth={2.5} />
            </div>
            <h2 id="request-course-title" className="text-slate-900 mb-1.5" style={TITLE}>
              {t('request.sheet.successTitle')}
            </h2>
            <p className="text-[14px] text-slate-500 mb-6 max-w-[280px]">{successMessage}</p>
            <button
              type="button"
              onClick={close}
              className="w-full h-11 rounded-[12px] text-[15px] font-semibold text-white"
              style={{ background: '#F7931E' }}
            >
              {t('request.sheet.done')}
            </button>
          </div>
        ) : (
          <>
            <div className="pt-1 pb-4">
              <h2 id="request-course-title" className="text-slate-900" style={TITLE}>
                {t('request.sheet.title')}
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 leading-snug">
                {t('request.sheet.subtitle')}
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className={labelCls} htmlFor="rc-name">
                  {t('request.sheet.nameLabel')}
                </label>
                <input
                  id="rc-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputCls}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="rc-location">
                  {t('request.sheet.locationLabel')}
                </label>
                <input
                  id="rc-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('request.sheet.locationPlaceholder')}
                  className={inputCls}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="rc-note">
                  {t('request.sheet.noteLabel')}{' '}
                  <span className="text-slate-400 font-normal">{t('request.sheet.optional')}</span>
                </label>
                <textarea
                  id="rc-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('request.sheet.notePlaceholder')}
                  rows={3}
                  className={`${inputCls} h-auto py-2.5 resize-none`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full h-11 mt-4 rounded-[12px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity ${status === 'submitting' ? '' : 'disabled:opacity-50'}`}
              style={{ background: '#F7931E' }}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  {t('request.sheet.sending')}
                </>
              ) : (
                t('request.sheet.submit')
              )}
            </button>
            {error && (
              <p className="mt-2.5 text-[13px] text-red-600 text-center" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </BottomSheet>
  );
}

export default RequestCourseSheet;
