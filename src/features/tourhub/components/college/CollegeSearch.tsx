import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollegeSearch } from '../../hooks/useCollegeStats';
import { useCollegeMediaMap } from '../../hooks/useCollegeMedia';
import { CollegeCard } from './CollegeCard';

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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8] pointer-events-none" />
        <input
          type="text"
          placeholder="Search colleges..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full h-11 pl-9 pr-9 bg-white border border-[#e2e8f0] rounded-xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#e2e8f0] focus:border-[#e2e8f0] transition-all"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#94a3b8] hover:text-[#1e293b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      
      {/* Results */}
      {showResults && (
        <div className="mt-3 space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-sm text-[#64748b]">
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
            <div className="text-center py-8 text-sm text-[#64748b]">
              No colleges found matching "{searchTerm}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}
