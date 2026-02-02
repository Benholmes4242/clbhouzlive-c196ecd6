import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { MAX_REVIEW_LENGTH } from '../constants';

interface ReviewTextSectionProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ReviewTextSection = React.memo(function ReviewTextSection({
  value,
  onChange,
  disabled = false,
}: ReviewTextSectionProps) {
  return (
    <section className="px-6 pt-6 pb-3 bg-slate-100">
      <label className="text-base font-semibold text-slate-900 mb-2 block">
        Share your thoughts
      </label>

      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder="Share your review with other golfers – what stood out about the design, conditions, clubhouse or overall experience?"
        className="w-full min-h-[140px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 caret-slate-700 resize-none focus:outline-none focus:bg-slate-50 focus:border-slate-300 focus:ring-2 focus:ring-slate-200 transition-colors"
        disabled={disabled}
        maxLength={MAX_REVIEW_LENGTH}
      />
      <div className="mt-1 flex justify-end">
        <p 
          className="text-xs text-slate-400"
          aria-live="polite"
          aria-atomic="true"
        >
          {value.length}/{MAX_REVIEW_LENGTH}
        </p>
      </div>
    </section>
  );
});

export default ReviewTextSection;
