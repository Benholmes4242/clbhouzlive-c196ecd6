import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useCollegeSearch } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';

interface CollegeSearchProps {
  className?: string;
}

export function CollegeSearch({ className }: CollegeSearchProps) {
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebouncedValue(searchInput, 200);
  const { data: results, isLoading } = useCollegeSearch(debouncedSearch);
  const { data: collegeMap } = useCollegeMediaMap();
  
  const showResults = debouncedSearch.length >= 2;
  
  return (
    <div className={cn('relative', className)}>
      {/* Search Input — rounded-2xl, bg-card, border/50 */}
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-5 h-5"
          style={{ color: 'hsl(var(--muted-foreground) / 0.5)' }}
          strokeWidth={2.5}
        />
        <input
          type="text"
          placeholder="Search colleges..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full pl-11 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-border focus:shadow-lg"
          style={{
            height: 48,
            fontSize: 14,
            background: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border) / 0.5)',
            borderRadius: 16,
            padding: '12px 16px 12px 44px',
            
          }}
        />
        {searchInput && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted hover:bg-muted/80 active:scale-[0.9] transition-transform"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.button>
        )}
      </div>
      
      {/* Results */}
      <AnimatePresence mode="wait">
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.2 }}
            className="mt-3 space-y-2"
          >
            {isLoading ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results && results.length > 0 ? (
              results.map((stats, index) => (
                <motion.div
                  key={stats.normalized_name}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                >
                  <CollegeCard
                    stats={stats}
                    college={collegeMap?.get(stats.normalized_name) || null}
                  />
                </motion.div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No colleges found matching "{debouncedSearch}"
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
