import React from 'react';
import { Button } from '@/components/ui/button';

interface RatingFormFooterProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  isFormValid: boolean;
  onSubmit: () => void;
  onRemove: () => void;
}

const RatingFormFooter = React.memo(function RatingFormFooter({
  isEditMode,
  isSubmitting,
  isFormValid,
  onSubmit,
  onRemove,
}: RatingFormFooterProps) {
  if (isEditMode) {
    return (
      <footer className="px-6 pt-6 pb-4 mb-4 bg-slate-50">
        <div className="flex flex-col w-full gap-3 mb-2">
          <div className="flex w-full items-center justify-between gap-3">
            {/* Remove rating (left) */}
            <button
              type="button"
              onClick={onRemove}
              disabled={isSubmitting}
              className="flex-1 inline-flex items-center justify-center rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 bg-white/80 hover:bg-red-50 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed h-11"
            >
              Remove rating
            </button>

            {/* Update rating (right) */}
            <Button
              type="submit"
              onClick={onSubmit}
              disabled={isSubmitting || !isFormValid}
              variant="outline"
              className="flex-1 h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium py-3 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving…' : 'Update rating'}
            </Button>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="px-6 pt-6 pb-4 mb-4 bg-slate-50">
      <div className="flex flex-col items-center gap-2">
        <Button
          type="submit"
          onClick={onSubmit}
          disabled={isSubmitting || !isFormValid}
          variant="outline"
          className="w-full h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium py-3 hover:bg-slate-50 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Saving…' : 'Submit rating'}
        </Button>
        {/* Hint when disabled */}
        {!isFormValid && !isSubmitting && (
          <p className="text-xs text-slate-400 text-center">
            Set an overall rating to continue.
          </p>
        )}
      </div>
    </footer>
  );
});

export default RatingFormFooter;
