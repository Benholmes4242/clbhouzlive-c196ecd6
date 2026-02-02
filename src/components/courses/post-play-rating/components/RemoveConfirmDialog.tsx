import React from 'react';
import { Button } from '@/components/ui/button';

interface RemoveConfirmDialogProps {
  isOpen: boolean;
  courseName: string;
  isDeleted: boolean;
  isFadingOut: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

const RemoveConfirmDialog = React.memo(function RemoveConfirmDialog({
  isOpen,
  courseName,
  isDeleted,
  isFadingOut,
  onCancel,
  onConfirm,
}: RemoveConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div 
        className={`w-[90%] max-w-sm rounded-3xl bg-slate-50 shadow-xl border border-slate-200 px-5 py-6 space-y-3 transition-opacity duration-300 ease-out ${
          isFadingOut ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {!isDeleted ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Remove rating?</h2>
            <p className="text-sm text-slate-600 mb-6">
              This will permanently delete your rating and review for this course.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button
                type="button"
                className="h-11 rounded-xl border border-slate-600 bg-white text-slate-600 text-base font-medium px-5 py-2 hover:bg-slate-50 active:scale-[0.99]"
                onClick={onCancel}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="h-11 rounded-xl border border-red-300 bg-white/80 text-red-600 text-base font-semibold px-5 py-2 hover:bg-red-50 active:scale-[0.99]"
                onClick={onConfirm}
              >
                Delete
              </Button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Course removed</h2>
            <p className="text-sm text-slate-600">
              {courseName} has been removed from your played list. You can add a new rating at any time.
            </p>
          </>
        )}
      </div>
    </div>
  );
});

export default RemoveConfirmDialog;
