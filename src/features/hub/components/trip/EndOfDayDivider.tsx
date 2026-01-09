/**
 * EndOfDayDivider - Soft visual closure at end of each day
 * A faint horizontal gradient or centered dot
 */

import React from 'react';

export function EndOfDayDivider() {
  return (
    <div className="flex items-center justify-center py-3 px-4">
      <div 
        className="w-full h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.08) 30%, rgba(0,0,0,0.08) 70%, transparent 100%)',
        }}
      />
    </div>
  );
}
