import { useState } from 'react';
import { X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCollegeLogoUrl } from '@/utils/collegeLogo';
import { useCollegeSeasonStats } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { useCollegeCompare } from '../../hooks/useCollegeCompare';
import { CollegeCompareHero } from './CollegeCompareHero';

interface CollegeCompareSheetProps {
  open: boolean;
  onClose: () => void;
  college1Slug: string;
  college2Slug?: string;
  onSelectCollege2?: (slug: string) => void;
}

export function CollegeCompareSheet({ open, onClose, college1Slug, college2Slug, onSelectCollege2 }: CollegeCompareSheetProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: allStats } = useCollegeSeasonStats();
  const { data: collegeMap } = useCollegeMediaMap();
  const { data: compareData, isLoading } = useCollegeCompare(college1Slug, college2Slug);

  const filteredColleges = (allStats || [])
    .filter(s => {
      if (s.normalized_name === college1Slug) return false;
      if (!searchTerm) return true;
      const media = collegeMap?.get(s.normalized_name);
      const name = media?.college_name || s.normalized_name;
      return name.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.earnings_total - a.earnings_total)
    .slice(0, 20);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            className="fixed inset-x-0 bottom-0 z-50 bg-background rounded-t-2xl"
            style={{ maxHeight: '85dvh', overflowY: 'auto' }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background px-4 pt-4 pb-2 border-b border-border/50">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-foreground" style={{ fontSize: 18, fontWeight: 700 }}>
                  Compare Programs
                </h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-muted/50 transition-colors">
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {!college2Slug && (
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search colleges..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-muted/50 border border-border/50 text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              )}
            </div>

            <div className="p-4">
              {/* If both selected, show comparison */}
              {college2Slug && compareData ? (
                <CollegeCompareHero data={compareData} />
              ) : (
                /* College picker list */
                <div className="space-y-1">
                  {filteredColleges.map(s => {
                    const media = collegeMap?.get(s.normalized_name);
                    const name = media?.short_name || media?.college_name || s.normalized_name;
                    const logo = getCollegeLogoUrl(media?.college_name || s.normalized_name);

                    return (
                      <button
                        key={s.normalized_name}
                        onClick={() => onSelectCollege2?.(s.normalized_name)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl active:bg-muted/60 transition-colors"
                      >
                        {logo ? (
                          <img src={logo} alt={name} className="w-8 h-8 object-contain" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-bold">
                            {name.charAt(0)}
                          </div>
                        )}
                        <span className="text-foreground" style={{ fontSize: 14, fontWeight: 600 }}>{name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {isLoading && (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
