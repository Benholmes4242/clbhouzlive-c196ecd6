import React from 'react';

interface SegmentedBarProps {
  level: number;       // How many segments are filled (1-5)
  max?: number;        // Total segments (default 5)
  color: string;       // Tailwind bg class for filled segments, e.g. 'bg-red-500'
}

const SegmentedBar: React.FC<SegmentedBarProps> = ({ level, max = 5, color }) => {
  return (
    <div className="flex gap-[3px] items-center">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-all duration-400 ${
            i < level ? color : 'bg-slate-200'
          }`}
          style={{ transitionDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
};

export default SegmentedBar;
