import { useState } from 'react';
import { Plus, Flag, ChevronRight } from 'lucide-react';
import { RequestCourseSheet } from './RequestCourseSheet';

interface RequestCourseCTAProps {
  prefillName?: string;
  variant?: 'button' | 'row';
  className?: string;
}

export function RequestCourseCTA({ prefillName, variant = 'button', className = '' }: RequestCourseCTAProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {variant === 'button' ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`inline-flex items-center justify-center gap-2 h-11 px-4 rounded-[12px] border border-slate-200 bg-white text-[14px] font-semibold text-slate-900 active:bg-slate-50 ${className}`}
        >
          <Plus size={18} color="#F7931E" strokeWidth={2.5} />
          Request this course
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={`w-full flex items-center gap-3 px-4 py-3 bg-white active:bg-slate-50 text-left ${className}`}
        >
          <div
            className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(247,147,30,0.12)' }}
          >
            <Flag size={20} color="#F7931E" strokeWidth={2.25} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-slate-900 leading-tight">Request a course</div>
            <div className="text-[13px] text-slate-500 leading-tight mt-0.5 truncate">
              Can't find it? We'll get it added.
            </div>
          </div>
          <ChevronRight size={18} className="text-slate-400 shrink-0" />
        </button>
      )}

      <RequestCourseSheet open={open} onOpenChange={setOpen} prefillName={prefillName} />
    </>
  );
}

export default RequestCourseCTA;
