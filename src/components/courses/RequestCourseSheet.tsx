import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { supabase } from '@/integrations/supabase/client';

interface RequestCourseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefillName?: string;
}

type Status = 'form' | 'submitting' | 'success';

export function RequestCourseSheet({ open, onOpenChange, prefillName }: RequestCourseSheetProps) {
  const [status, setStatus] = useState<Status>('form');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>("We'll email you when this course is added.");

  // Reset on open
  useEffect(() => {
    if (open) {
      setStatus('form');
      setName(prefillName ?? '');
      setLocation('');
      setNote('');
      setError(null);
      setSuccessMessage("We'll email you when this course is added.");
    }
  }, [open, prefillName]);

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
        throw new Error(data?.message || 'Something went wrong. Please try again.');
      }
    } catch (e: any) {
      setError(e?.message || 'Something went wrong. Please try again.');
      setStatus('form');
    }
  };

  const close = () => onOpenChange(false);

  const labelCls = 'block text-[13px] font-medium text-slate-700 mb-1.5';
  const inputCls =
    'w-full h-11 px-3 rounded-[10px] border border-slate-200 bg-white text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#F7931E]/40 focus:border-[#F7931E]';

  return (
    <BottomSheet open={open} onClose={close} ariaLabelledBy="request-course-title">
      <div className="px-5 pt-2 pb-5">
        {status === 'success' ? (
          <div className="flex flex-col items-center text-center pt-6 pb-2">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: 'rgba(247,147,30,0.12)' }}
            >
              <Check size={28} color="#F7931E" strokeWidth={2.5} />
            </div>
            <h2 id="request-course-title" className="text-[18px] font-semibold text-slate-900 mb-1.5">
              Thanks — we've got it.
            </h2>
            <p className="text-[14px] text-slate-500 mb-6 max-w-[280px]">{successMessage}</p>
            <button
              type="button"
              onClick={close}
              className="w-full h-11 rounded-[12px] text-[15px] font-semibold text-white"
              style={{ background: '#F7931E' }}
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="pt-1 pb-4">
              <h2 id="request-course-title" className="text-[18px] font-semibold text-slate-900">
                Request a course
              </h2>
              <p className="text-[13px] text-slate-500 mt-1 leading-snug">
                Can't find it? Tell us the name and location and we'll get it added.
              </p>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className={labelCls} htmlFor="rc-name">
                  Course name
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
                  Location
                </label>
                <input
                  id="rc-location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Town, region, country"
                  className={inputCls}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelCls} htmlFor="rc-note">
                  Note <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="rc-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Anything else? New opening, alternative name…"
                  rows={3}
                  className={`${inputCls} h-auto py-2.5 resize-none`}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="w-full h-11 mt-5 rounded-[12px] text-[15px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: '#F7931E' }}
            >
              {status === 'submitting' ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending…
                </>
              ) : (
                'Request course'
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
