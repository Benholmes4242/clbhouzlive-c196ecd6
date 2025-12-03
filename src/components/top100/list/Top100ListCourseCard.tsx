import React from 'react';
import CountryFlag from '@/components/ui/country-flag';

interface CourseData {
  id: string;
  name: string;
  rank: number;
  imageUrl: string | null;
  country: string;
  subCountry?: string | null;
  flagEmoji?: string;
  regionShort?: string;
  played: boolean;
  rankingBadges?: Array<{ id: string; label: string }>;
}

interface Top100ListCourseCardProps {
  course: CourseData;
  onClick: () => void;
}

export const Top100ListCourseCard: React.FC<Top100ListCourseCardProps> = ({
  course,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      className="mx-4 mb-3 rounded-3xl bg-white shadow-sm flex overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all w-[calc(100%-2rem)] text-left"
    >
      {/* Rank column */}
      <div className="w-12 flex items-center justify-center flex-shrink-0">
        <span className="text-[17px] font-semibold text-[#F3B13E]">
          #{course.rank}
        </span>
      </div>

      {/* Thumbnail + meta */}
      <div className="flex-1 flex gap-3 py-3 pr-4">
        <div className="w-24 h-16 rounded-2xl overflow-hidden relative flex-shrink-0">
          <img
            src={course.imageUrl || '/placeholder.svg'}
            alt={course.name}
            className="w-full h-full object-cover"
          />
          {/* Ranking bubbles */}
          {course.rankingBadges && course.rankingBadges.length > 0 && (
            <div className="absolute top-1 left-1 flex gap-1 flex-wrap">
              {course.rankingBadges.slice(0, 2).map((badge) => (
                <div
                  key={badge.id}
                  className="px-2 py-[2px] rounded-full bg-black/55 text-[10px] text-white"
                >
                  {badge.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-snug line-clamp-2 text-slate-900">
            {course.name}
          </div>
          <div className="mt-0.5 text-[12px] text-slate-500 flex items-center gap-1.5">
            <CountryFlag country={course.country} size="sm" />
            <span className="truncate">
              {course.country}
              {course.subCountry && `, ${course.subCountry}`}
            </span>
          </div>

          <div className="mt-1 flex items-center justify-between">
            {/* Region short */}
            {course.regionShort && (
              <div className="flex items-center gap-1 text-[12px] text-slate-500">
                {course.flagEmoji && <span className="text-base">{course.flagEmoji}</span>}
                <span>{course.regionShort}</span>
              </div>
            )}

            {/* Played pill */}
            {course.played ? (
              <span className="px-2 py-[3px] rounded-full bg-[#FFEFD5] text-[11px] font-semibold text-[#F3B13E]">
                Played
              </span>
            ) : (
              <span className="px-2 py-[3px] rounded-full bg-slate-100 text-[11px] text-slate-500">
                Not played yet
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
