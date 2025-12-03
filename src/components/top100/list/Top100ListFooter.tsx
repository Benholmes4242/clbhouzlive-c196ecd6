import React from 'react';

interface Top100ListFooterProps {
  onOpenPlanner?: () => void;
}

export const Top100ListFooter: React.FC<Top100ListFooterProps> = ({ onOpenPlanner }) => {
  return (
    <section className="mt-4 mb-8 mx-4 rounded-2xl bg-slate-900 text-white px-4 py-4">
      <div className="text-[14px] font-semibold">
        Plan your next Top 100 trip?
      </div>
      <div className="mt-1 text-[12px] text-white/80">
        Build an itinerary using the courses you haven't played yet on this list.
      </div>
      <button
        onClick={onOpenPlanner}
        className="mt-3 px-4 py-2 rounded-full bg-white text-[13px] font-semibold text-slate-900 hover:bg-white/90 transition-colors"
      >
        Open course planner
      </button>
    </section>
  );
};
