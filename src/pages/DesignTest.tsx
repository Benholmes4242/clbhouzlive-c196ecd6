import React from 'react';

const DesignTest = () => {
  const options = [
    { label: 'bg-white/85', bg: 'rgba(255,255,255,0.85)' },
    { label: 'bg-white/90', bg: 'rgba(255,255,255,0.90)' },
    { label: 'bg-white/95', bg: 'rgba(255,255,255,0.95)' },
  ];

  return (
    <div
      className="min-h-screen p-6"
      style={{
        background: 'linear-gradient(to bottom, #FFFBEB 0%, rgba(254,243,199,0.3) 45%, rgba(254,243,199,0.2) 70%, white 100%)',
      }}
    >
      <h1 className="text-lg font-bold text-gray-900 mb-6">Card Opacity Comparison</h1>

      <div className="space-y-8">
        {options.map((opt) => (
          <div key={opt.label}>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {opt.label}
            </p>

            {/* Card mock */}
            <div
              className="rounded-2xl border border-amber-200/20 p-4 space-y-3 backdrop-blur-sm"
              style={{ backgroundColor: opt.bg }}
            >
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                CAPTION
              </p>

              {/* Fake text input */}
              <div
                className="rounded-xl border border-amber-200/30 px-3 py-2 min-h-[80px]"
                style={{ backgroundColor: opt.bg }}
              >
                <p className="text-sm text-gray-400">Write a caption for your moment...</p>
              </div>

              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-4">
                TAGGED COURSES
              </p>
              <div className="flex gap-2">
                <span className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-full px-3 py-1">
                  Royal Porthcawl Golf Club ×
                </span>
              </div>

              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-4">
                CATEGORIES
              </p>
              <div className="flex gap-2 flex-wrap">
                <span className="bg-amber-100 border border-amber-300 text-amber-800 text-xs rounded-full px-3 py-1">
                  tips-coaching
                </span>
                <span className="bg-amber-100 border border-amber-300 text-amber-800 text-xs rounded-full px-3 py-1">
                  practice
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-8 text-center">
        Compare how each card stands out against the amber background above vs the white fade below.
      </p>
    </div>
  );
};

export default DesignTest;
