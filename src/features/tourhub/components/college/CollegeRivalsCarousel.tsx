import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeRivalries } from '../../hooks/useCollegeMovers';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';

interface CollegeRivalsCarouselProps {
  normalizedName: string;
  onCompare?: (rivalSlug: string) => void;
}

export function CollegeRivalsCarousel({ normalizedName, onCompare }: CollegeRivalsCarouselProps) {
  const { data: rivalries, isLoading } = useCollegeRivalries(normalizedName);
  const { data: collegeMap } = useCollegeMediaMap();

  if (isLoading || !rivalries?.length) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.3 }}
    >
      <h3 className="text-foreground" style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
        Rivalries
      </h3>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-none">
        {rivalries.map(r => {
          const media = r.college || collegeMap?.get(r.rivalNormalizedName);
          const name = media?.short_name || media?.college_name || r.rivalNormalizedName;
          const logo = getCollegeLogoUrl(media?.college_name || r.rivalNormalizedName);

          return (
            <Link
              key={r.id}
              to={`/tourhub/college-golf/${r.rivalNormalizedName}`}
              className="flex-shrink-0 flex flex-col items-center gap-2 rounded-xl border border-border/50 bg-card px-5 py-4 active:bg-muted/40 transition-colors"
              style={{ minWidth: 120 }}
            >
              {logo ? (
                <img src={logo} alt={name} className="w-12 h-12 object-contain" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-lg font-bold">
                  {name.charAt(0)}
                </div>
              )}
              <span className="text-foreground text-center" style={{ fontSize: 13, fontWeight: 600 }}>
                {name}
              </span>
              {onCompare && (
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onCompare(r.rivalNormalizedName); }}
                  className="text-primary"
                  style={{ fontSize: 11, fontWeight: 600 }}
                >
                  Compare
                </button>
              )}
            </Link>
          );
        })}
      </div>
    </motion.section>
  );
}
