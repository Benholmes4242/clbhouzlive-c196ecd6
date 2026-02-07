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
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search colleges..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full h-11 pl-9 pr-9 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-border focus:border-border transition-all"
        />
        {searchInput && (
          <button
            onClick={() => setSearchInput('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground active:scale-90 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
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
