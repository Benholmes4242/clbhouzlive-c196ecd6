import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { REPORT_REASONS, triggerHaptic } from '@/components/comments/utils';

interface ReportCommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, details?: string) => void;
  isDark: boolean;
}

export const ReportCommentModal: React.FC<ReportCommentModalProps> = ({ isOpen, onClose, onSubmit, isDark }) => {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [details, setDetails] = useState('');
  const [step, setStep] = useState<'reason' | 'details' | 'confirm'>('reason');

  const handleSubmit = () => {
    if (selectedReason) {
      onSubmit(selectedReason, details);
      triggerHaptic('success');
      setStep('confirm');
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setStep('reason');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div className={cn(
        "absolute inset-0",
        isDark ? "bg-black/70" : "bg-black/50"
      )} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "relative w-full max-w-sm rounded-[20px] overflow-hidden",
          isDark ? "bg-zinc-900" : "bg-white"
        )}
      >
        {step === 'confirm' ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className={cn("text-[18px] font-semibold mb-2", isDark ? "text-white" : "text-foreground")}>
              Thanks for letting us know
            </h3>
            <p className={cn("text-[14px] mb-6", isDark ? "text-white/60" : "text-muted-foreground")}>
              We'll review this comment and take action if needed.
            </p>
            <button
              onClick={handleClose}
              className={cn(
                "w-full py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                isDark ? "bg-white text-black" : "bg-foreground text-background"
              )}
            >
              Done
            </button>
          </div>
        ) : step === 'details' ? (
          <div className="p-5">
            <h3 className={cn("text-[18px] font-semibold mb-4", isDark ? "text-white" : "text-foreground")}>
              Add details (optional)
            </h3>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Tell us more about this issue..."
              className={cn(
                "w-full h-24 px-4 py-3 rounded-[12px] text-[14px] resize-none outline-none",
                isDark
                  ? "bg-white/10 text-white placeholder:text-white/40 border border-white/15"
                  : "bg-muted text-foreground placeholder:text-muted-foreground border border-border"
              )}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setStep('reason')}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
                )}
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white text-black" : "bg-foreground text-background"
                )}
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className={cn("text-[18px] font-semibold mb-4", isDark ? "text-white" : "text-foreground")}>
              Why are you reporting this?
            </h3>
            <div className="space-y-2">
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => setSelectedReason(reason.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 rounded-[12px] transition-colors",
                    selectedReason === reason.id
                      ? isDark ? "bg-white/15" : "bg-primary/10"
                      : isDark ? "bg-white/5 hover:bg-white/10" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <span className={cn("text-[14px]", isDark ? "text-white" : "text-foreground")}>
                    {reason.label}
                  </span>
                  {selectedReason === reason.id && (
                    <div className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center",
                      isDark ? "bg-white" : "bg-primary"
                    )}>
                      <svg className={cn("w-3 h-3", isDark ? "text-black" : "text-white")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleClose}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  isDark ? "bg-white/10 text-white" : "bg-muted text-foreground"
                )}
              >
                Cancel
              </button>
              <button
                onClick={() => selectedReason && setStep('details')}
                disabled={!selectedReason}
                className={cn(
                  "flex-1 py-3 rounded-[12px] text-[15px] font-medium transition-colors",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  isDark ? "bg-white text-black" : "bg-foreground text-background"
                )}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ReportCommentModal;
