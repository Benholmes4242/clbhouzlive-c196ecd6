import React from 'react';
import CountryFlag from '@/components/ui/country-flag';

interface Top100ListCourseCardProps {
  rank: number;
  courseName: string;
  country: string;
  subCountry?: string | null;
  thumbnailUrl: string | null;
  isPlayed: boolean;
  isShortlisted?: boolean;
  onClick: () => void;
}

export const Top100ListCourseCard: React.FC<Top100ListCourseCardProps> = ({
  rank,
  courseName,
  country,
  subCountry,
  thumbnailUrl,
  isPlayed,
  isShortlisted,
  onClick,
}) => {
  const locationLabel = subCountry ? `${country}, ${subCountry}` : country;

  return (
    <button
      onClick={onClick}
      className="mx-4 mb-3 rounded-3xl bg-white shadow-sm flex overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all w-[calc(100%-2rem)] text-left"
    >
      {/* Thumbnail with rank badge */}
      <div className="relative w-24 h-20 flex-shrink-0">
        <img
          src={thumbnailUrl || '/placeholder.svg'}
          alt={courseName}
          className="w-full h-full object-cover"
        />
        {/* Rank badge overlay */}
        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-[#F3B13E] text-white text-[12px] font-bold shadow-sm">
          #{rank}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center py-3 px-3 min-w-0">
        {/* Course name */}
        <div className="text-[14px] font-semibold leading-snug line-clamp-2 text-slate-900">
          {courseName}
        </div>
        
        {/* Location */}
        <div className="mt-1 text-[12px] text-slate-500 flex items-center gap-1.5">
          <CountryFlag country={country} size="sm" />
          <span className="truncate">{locationLabel}</span>
        </div>
      </div>

      {/* Status pill */}
      <div className="flex items-center pr-4">
        {isPlayed ? (
          <span className="px-2.5 py-1 rounded-full bg-[#FFEFD5] text-[11px] font-semibold text-[#F3B13E]">
            Played
          </span>
        ) : isShortlisted ? (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[11px] font-semibold text-blue-600 border border-blue-200">
            Shortlisted
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-slate-50 text-[11px] text-slate-500 border border-slate-200">
            Not played
          </span>
        )}
      </div>
    </button>
  );
};
