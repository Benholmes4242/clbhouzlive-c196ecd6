import React from 'react';
import { Clock, Video } from 'lucide-react';

interface SwingAnalysis {
  id: string;
  title: string;
  date: string;
  status: 'analysed' | 'processing' | 'error';
  thumbnailUrl?: string;
  club?: string;
  tags?: string[];
}

interface SwingAnalysisTimelineProps {
  analyses: SwingAnalysis[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export const SwingAnalysisTimeline: React.FC<SwingAnalysisTimelineProps> = ({
  analyses,
  selectedId,
  onSelect
}) => {
  const getStatusStyles = (status: SwingAnalysis['status']) => {
    switch (status) {
      case 'analysed':
        return {
          dot: 'border-emerald-300 bg-emerald-50',
          animation: ''
        };
      case 'processing':
        return {
          dot: 'border-amber-300 bg-amber-50',
          animation: 'animate-[pulseDot_1.2s_ease-in-out_infinite]'
        };
      case 'error':
        return {
          dot: 'border-red-300 bg-red-50',
          animation: ''
        };
    }
  };

  const getStatusChip = (status: SwingAnalysis['status']) => {
    switch (status) {
      case 'analysed':
        return <span className="rounded-full bg-emerald-50 text-emerald-700 text-[11px] px-2 py-0.5 border border-emerald-100">Analysed</span>;
      case 'processing':
        return <span className="rounded-full bg-amber-50 text-amber-700 text-[11px] px-2 py-0.5 border border-amber-100">Processing</span>;
      case 'error':
        return <span className="rounded-full bg-red-50 text-red-700 text-[11px] px-2 py-0.5 border border-red-100">Error</span>;
    }
  };

  return (
    <div className="space-y-0">
      {/* Sticky section header */}
      <div className="sticky top-0 z-10 px-4 sm:px-5 py-2 bg-white/85 backdrop-blur border-b border-black/[0.06]">
        <h3 className="text-[14px] font-semibold text-gray-900">Past Analyses</h3>
      </div>

      {/* Timeline items */}
      <div className="space-y-0">
        {analyses.map((analysis, index) => {
          const statusStyles = getStatusStyles(analysis.status);
          const isSelected = selectedId === analysis.id;
          const isFirst = index === 0;

          return (
            <div key={analysis.id} className="relative flex gap-3 px-4 sm:px-5 py-3">
              {/* Timeline rail (hidden for first item) */}
              {!isFirst && (
                <div className="absolute left-[18px] top-0 bottom-0 w-px bg-black/10" />
              )}

              {/* Status dot */}
              <div className="relative z-[1] mt-1.5 shrink-0">
                <div 
                  className={`h-3 w-3 rounded-full bg-white border-2 ${statusStyles.dot} ${statusStyles.animation}`}
                  role="status"
                  aria-label={`Status: ${analysis.status}`}
                />
              </div>

              {/* Card preview */}
              <button
                type="button"
                role="button"
                aria-pressed={isSelected}
                onClick={() => onSelect(analysis.id)}
                className={`
                  flex-1 rounded-xl bg-white/92 border border-black/[0.06] shadow-sm hover:shadow-md 
                  transition overflow-hidden text-left
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2A9D8F]
                  ${isSelected ? 'ring-1 ring-[#2A9D8F]/35 shadow-[0_6px_20px_rgba(42,157,143,0.25)]' : ''}
                `}
              >
                {/* Thumbnail */}
                {analysis.thumbnailUrl && (
                  <div className="relative aspect-[16/9] bg-black">
                    <img 
                      src={analysis.thumbnailUrl} 
                      alt={analysis.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <div className="absolute bottom-2 left-2">
                      <Video className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Content */}
                <div className="px-3 py-2.5 space-y-1.5">
                  {/* Title and status */}
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-[14px] font-semibold text-gray-900 line-clamp-1">
                      {analysis.title}
                    </h4>
                    {getStatusChip(analysis.status)}
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-2 text-[12px] text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>{analysis.date}</span>
                    {analysis.club && (
                      <>
                        <span>•</span>
                        <span>{analysis.club}</span>
                      </>
                    )}
                  </div>

                  {/* Tags */}
                  {analysis.tags && analysis.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {analysis.tags.slice(0, 3).map((tag, i) => (
                        <span 
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-black/[0.05] text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
