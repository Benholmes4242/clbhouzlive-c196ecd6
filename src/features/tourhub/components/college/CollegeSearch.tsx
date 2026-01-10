import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeSearch } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';
import { Input } from '@/components/ui/input';

interface CollegeSearchProps {
  className?: string;
}

export function CollegeSearch({ className }: CollegeSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: results, isLoading } = useCollegeSearch(searchTerm);
  const { data: collegeMap } = useCollegeMediaMap();
  
  const showResults = searchTerm.length >= 2;
  
  return (
    <div className={cn('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
        <Input
          type="text"
          placeholder="Search colleges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 pr-9 bg-surface-card"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Results */}
      {showResults && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-body-sm text-text-secondary">
              Searching...
            </div>
          ) : results && results.length > 0 ? (
            results.map((stats) => (
              <CollegeCard
                key={stats.normalized_name}
                stats={stats}
                college={collegeMap?.get(stats.normalized_name) || null}
              />
            ))
          ) : (
            <div className="text-center py-8 text-body-sm text-text-secondary">
              No colleges found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
