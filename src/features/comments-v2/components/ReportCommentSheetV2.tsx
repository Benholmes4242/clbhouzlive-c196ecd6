/**
 * ReportCommentSheetV2 — fresh UI, same backend contract:
 * calls back onSubmit(reason, details) which the parent forwards to
 * useCommentsV2.reportComment (writes hidden_comments + reports).
 */
import { TITLE as TITLE_SCALE } from '@/lib/tokens/type';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

const INK = '#F8FAFC';
const SECONDARY = 'rgba(248,250,252,0.60)';
const MUTED = 'rgba(248,250,252,0.40)';
const AMBER = '#F7931E';
const HAIRLINE = 'rgba(255,255,255,0.10)';

const REASONS: { id: string; label: string }[] = [
  { id: 'spam', label: 'Spam or misleading' },
  { id: 'harassment', label: 'Harassment or bullying' },
  { id: 'hate', label: 'Hate speech' },
  { id: 'nudity', label: 'Nudity or sexual content' },
  { id: 'violence', label: 'Violence or dangerous behaviour' },
  { id: 'other', label: 'Something else' },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => Promise<void> | void;
}

export function ReportCommentSheetV2({ open, onClose, onSubmit }: Props) {
  const [reason, setReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'done'>('reason');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setReason(null); setDetails(''); setStep('reason'); setSubmitting(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    try {
      await onSubmit(reason, details || undefined);
      setStep('done');
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[12006] bg-black/40"
            onClick={close}
          />
          <motion.div
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed left-0 right-0 bottom-0 z-[12007] mx-auto"
            style={{
              maxWidth: 560, background: '#1B1E27',
              borderRadius: '20px 20px 0 0',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            }}
          >
            <div className="flex justify-center pt-2.5 pb-2">
              <div style={{ width: 36, height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.18)' }} />
            </div>

            <div className="flex items-center justify-between px-5 pb-2">
              <span style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.14em',
                textTransform: 'uppercase', color: AMBER,
              }}>REPORT COMMENT</span>
              <button type="button" onClick={close} className="bg-transparent border-0 p-1 cursor-pointer" aria-label="Close">
                <X size={16} style={{ color: SECONDARY }} />
              </button>
            </div>

            {step === 'reason' && (
              <div className="px-5 pb-4">
                <h3 style={{ ...TITLE_SCALE, color: INK, marginBottom: 12 }}>
                  Why are you reporting this?
                </h3>
                <div className="space-y-2">
                  {REASONS.map((r) => {
                    const active = reason === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setReason(r.id)}
                        className="w-full flex items-center justify-between px-4 py-3 bg-transparent cursor-pointer text-left"
                        style={{
                          borderRadius: 12,
                          border: `1px solid ${active ? AMBER : HAIRLINE}`,
                          background: active ? 'rgba(247,147,30,0.10)' : '#1B1E27',
                        }}
                      >
                        <span style={{ fontSize: 14, color: INK }}>{r.label}</span>
                        {active && (
                          <span
                            className="flex items-center justify-center"
                            style={{ width: 18, height: 18, borderRadius: '50%', background: AMBER }}
                          >
                            <Check size={12} color="#FFFFFF" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => reason && setStep('details')}
                  disabled={!reason}
                  className="w-full mt-4 py-3 cursor-pointer"
                  style={{
                    borderRadius: 12, border: 0,
                    background: reason ? AMBER : 'rgba(255,255,255,0.10)',
                    color: reason ? '#FFFFFF' : MUTED,
                    fontSize: 15, fontWeight: 700,
                  }}
                >
                  Next
                </button>
              </div>
            )}

            {step === 'details' && (
              <div className="px-5 pb-4">
                <h3 style={{ ...TITLE_SCALE, color: INK, marginBottom: 12 }}>
                  Add details (optional)
                </h3>
                <textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us more…"
                  className="w-full outline-none"
                  style={{
                    height: 96, padding: 12, borderRadius: 12,
                    border: `1px solid ${HAIRLINE}`, background: '#1B1E27',
                    fontSize: 14, color: INK, resize: 'none',
                  }}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setStep('reason')}
                    className="flex-1 py-3 cursor-pointer"
                    style={{
                      borderRadius: 12, border: `1px solid ${HAIRLINE}`,
                      background: '#1B1E27', color: INK, fontSize: 15, fontWeight: 600,
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={submit}
                    disabled={submitting}
                    className="flex-1 py-3 cursor-pointer"
                    style={{
                      borderRadius: 12, border: 0,
                      background: AMBER, color: '#FFFFFF', fontSize: 15, fontWeight: 700,
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </div>
            )}

            {step === 'done' && (
              <div className="px-5 pb-4 pt-2 text-center">
                <div
                  className="mx-auto mb-3 flex items-center justify-center"
                  style={{
                    width: 52, height: 52, borderRadius: '50%',
                    background: 'rgba(247,147,30,0.12)',
                  }}
                >
                  <Check size={22} color={AMBER} />
                </div>
                <h3 style={{ ...TITLE_SCALE, color: INK }}>Thanks for letting us know</h3>
                <p style={{ fontSize: 13, color: SECONDARY, marginTop: 6 }}>
                  We'll review this comment and take action if needed.
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="w-full mt-4 py-3 cursor-pointer"
                  style={{
                    borderRadius: 12, border: 0, background: INK,
                    color: '#FFFFFF', fontSize: 15, fontWeight: 700,
                  }}
                >
                  Done
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return typeof window !== 'undefined' ? createPortal(content, document.body) : null;
}

export default ReportCommentSheetV2;
