import React from 'react';

const DesignTest = () => {
  const options = [
    {
      label: 'Option A: Solid white + shadow',
      cardBg: 'rgba(255,255,255,1)',
      inputBg: 'rgba(255,255,255,1)',
      border: '1px solid rgba(217,119,6,0.15)',
      shadow: '0 1px 3px rgba(217,119,6,0.08)',
    },
    {
      label: 'Option B: White/95 + stronger border',
      cardBg: 'rgba(255,255,255,0.95)',
      inputBg: 'rgba(255,255,255,1)',
      border: '1px solid rgba(217,119,6,0.25)',
      shadow: 'none',
    },
    {
      label: 'Option C: White + amber shadow',
      cardBg: 'rgba(255,255,255,1)',
      inputBg: 'rgba(255,255,255,1)',
      border: '1px solid rgba(217,119,6,0.12)',
      shadow: '0 2px 8px rgba(217,119,6,0.1)',
    },
  ];

  return (
    <div
      className="min-h-screen p-5 pb-32"
      style={{
        background: 'linear-gradient(to bottom, #FFFBEB 0%, rgba(254,243,199,0.3) 45%, rgba(254,243,199,0.2) 70%, white 100%)',
      }}
    >
      <h1 className="text-lg font-bold text-gray-900 mb-1">Card Separation Test</h1>
      <p className="text-xs text-gray-500 mb-6">Which card stands out best without looking cold?</p>

      <div className="space-y-10">
        {options.map((opt) => (
          <div key={opt.label}>
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              {opt.label}
            </p>

            <div
              className="rounded-2xl p-4 space-y-3 backdrop-blur-sm"
              style={{
                backgroundColor: opt.cardBg,
                border: opt.border,
                boxShadow: opt.shadow,
              }}
            >
              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                CAPTION
              </p>
              <div
                className="rounded-xl px-3 py-2 min-h-[72px]"
                style={{
                  backgroundColor: opt.inputBg,
                  border: '1px solid rgba(217,119,6,0.2)',
                }}
              >
                <p className="text-sm text-gray-400">Write a caption for your moment...</p>
              </div>

              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-3">
                TAGGED COURSES
              </p>
              <div className="flex gap-2">
                <span className="bg-amber-50 border border-amber-300 text-amber-800 text-xs rounded-full px-3 py-1">
                  Royal Porthcawl Golf Club ×
                </span>
              </div>

              <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mt-3">
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
    </div>
  );
};

export default DesignTest;
