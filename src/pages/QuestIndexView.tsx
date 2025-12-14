/**
 * QuestIndexView - Full course index with search and filters
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, MapPin, CheckCircle, Star, ChevronDown } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Course type
interface QuestCourse {
  id: string;
  name: string;
  region: string;
  country: string;
  isPlayed: boolean;
  isWishlist?: boolean;
  dateAdded?: string;
  rating?: number;
}

// Filter types
type StatusFilter = 'all' | 'played' | 'unplayed' | 'wishlist';
type SortOption = 'recent' | 'alphabetical' | 'rating';

const REGIONS = ['All Regions', 'GB & Ireland', 'Continental Europe', 'USA', 'Worldwide'];

// Demo courses
const DEMO_COURSES: QuestCourse[] = [
  { id: '1', name: 'Royal County Down', region: 'GB & Ireland', country: 'Northern Ireland', isPlayed: true, dateAdded: 'Dec 8', rating: 4.9 },
  { id: '2', name: 'St Andrews Old Course', region: 'GB & Ireland', country: 'Scotland', isPlayed: true, dateAdded: 'Oct 15', rating: 4.8 },
  { id: '3', name: 'Muirfield', region: 'GB & Ireland', country: 'Scotland', isPlayed: true, dateAdded: 'Aug 18', rating: 4.7 },
  { id: '4', name: 'Royal Portrush', region: 'GB & Ireland', country: 'Northern Ireland', isPlayed: false, isWishlist: true },
  { id: '5', name: 'Carnoustie', region: 'GB & Ireland', country: 'Scotland', isPlayed: false },
  { id: '6', name: 'Royal Birkdale', region: 'GB & Ireland', country: 'England', isPlayed: false },
  { id: '7', name: 'Pebble Beach', region: 'USA', country: 'California', isPlayed: true, dateAdded: 'Nov 22', rating: 4.9 },
  { id: '8', name: 'Augusta National', region: 'USA', country: 'Georgia', isPlayed: false, isWishlist: true },
  { id: '9', name: 'Pine Valley', region: 'USA', country: 'New Jersey', isPlayed: false },
  { id: '10', name: 'Cypress Point', region: 'USA', country: 'California', isPlayed: false },
  { id: '11', name: 'Valderrama', region: 'Continental Europe', country: 'Spain', isPlayed: true, dateAdded: 'Jul 5', rating: 4.5 },
  { id: '12', name: 'Le Golf National', region: 'Continental Europe', country: 'France', isPlayed: false },
  { id: '13', name: 'Royal Melbourne West', region: 'Worldwide', country: 'Australia', isPlayed: true, dateAdded: 'Sep 3', rating: 4.8 },
  { id: '14', name: 'Cape Kidnappers', region: 'Worldwide', country: 'New Zealand', isPlayed: false, isWishlist: true },
];

// Filter pill component
const FilterPill: React.FC<{
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
    style={{
      background: isActive ? 'var(--dgp-accent-green)' : 'var(--dgp-glass-surface)',
      color: isActive ? '#000' : 'var(--dgp-text-secondary)',
      border: '1px solid',
      borderColor: isActive ? 'var(--dgp-accent-green)' : 'var(--dgp-glass-stroke)',
    }}
  >
    {label}
  </button>
);

// Course row component
const CourseRow: React.FC<{ course: QuestCourse }> = ({ course }) => (
  <div
    className="flex items-center gap-3 py-3 border-b"
    style={{ borderColor: 'var(--dgp-divider)' }}
  >
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: 'var(--dgp-glass-surface)' }}
    >
      <MapPin className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />
    </div>
    
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <p
          className="text-sm font-medium truncate"
          style={{ color: 'var(--dgp-text-primary)' }}
        >
          {course.name}
        </p>
        {course.rating && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Star className="w-3 h-3 fill-current" style={{ color: 'var(--dgp-accent-gold)' }} />
            <span className="text-xs" style={{ color: 'var(--dgp-accent-gold)' }}>
              {course.rating}
            </span>
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
        {course.country} · {course.region}
      </p>
    </div>
    
    <div className="flex items-center gap-2 flex-shrink-0">
      {course.dateAdded && (
        <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
          {course.dateAdded}
        </span>
      )}
      {course.isPlayed && (
        <CheckCircle
          className="w-5 h-5"
          style={{ color: 'var(--dgp-accent-green)' }}
        />
      )}
    </div>
  </div>
);

const QuestIndexView: React.FC = () => {
  const navigate = useNavigate();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [regionFilter, setRegionFilter] = useState('All Regions');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    let result = [...DEMO_COURSES];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(query) ||
          c.country.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'played') {
      result = result.filter((c) => c.isPlayed);
    } else if (statusFilter === 'unplayed') {
      result = result.filter((c) => !c.isPlayed);
    } else if (statusFilter === 'wishlist') {
      result = result.filter((c) => c.isWishlist);
    }

    // Region filter
    if (regionFilter !== 'All Regions') {
      result = result.filter((c) => c.region === regionFilter);
    }

    // Sort
    if (sortBy === 'alphabetical') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'rating') {
      result.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    // 'recent' keeps original order (already sorted by date)

    return result;
  }, [searchQuery, statusFilter, regionFilter, sortBy]);

  const playedCount = DEMO_COURSES.filter((c) => c.isPlayed).length;

  return (
    <PageRoot className="dgp-page">
      {/* Header */}
      <div className="sticky top-0 z-50 safe-top" style={{ background: 'var(--dgp-bg-primary)' }}>
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate(-1)}
            className="dgp-nav-button"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1
              className="text-lg font-semibold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              Quest Index
            </h1>
            <p className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
              {playedCount} of {DEMO_COURSES.length} courses played
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: 'var(--dgp-text-muted)' }}
            />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              style={{
                background: 'var(--dgp-glass-surface)',
                borderColor: 'var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-primary)',
              }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          <FilterPill
            label="All"
            isActive={statusFilter === 'all'}
            onClick={() => setStatusFilter('all')}
          />
          <FilterPill
            label="Played"
            isActive={statusFilter === 'played'}
            onClick={() => setStatusFilter('played')}
          />
          <FilterPill
            label="Unplayed"
            isActive={statusFilter === 'unplayed'}
            onClick={() => setStatusFilter('unplayed')}
          />
          <FilterPill
            label="Wishlist"
            isActive={statusFilter === 'wishlist'}
            onClick={() => setStatusFilter('wishlist')}
          />
        </div>

        {/* Dropdowns */}
        <div className="px-4 pb-3 flex gap-2">
          {/* Region dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--dgp-glass-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-secondary)',
              }}
            >
              {regionFilter}
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: 'var(--dgp-bg-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
              }}
            >
              {REGIONS.map((region) => (
                <DropdownMenuItem
                  key={region}
                  onClick={() => setRegionFilter(region)}
                  style={{ color: 'var(--dgp-text-primary)' }}
                >
                  {region}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: 'var(--dgp-glass-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
                color: 'var(--dgp-text-secondary)',
              }}
            >
              {sortBy === 'recent' ? 'Recently Added' : sortBy === 'alphabetical' ? 'A-Z' : 'Highest Rated'}
              <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              style={{
                background: 'var(--dgp-bg-surface)',
                border: '1px solid var(--dgp-glass-stroke)',
              }}
            >
              <DropdownMenuItem
                onClick={() => setSortBy('recent')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Recently Added
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('alphabetical')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Alphabetical
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setSortBy('rating')}
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                Highest Rated
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Course list */}
      <div className="px-4 pb-32">
        <div className="dgp-glass rounded-xl p-4">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <CourseRow key={course.id} course={course} />
            ))
          ) : (
            <div className="py-12 text-center">
              <p style={{ color: 'var(--dgp-text-muted)' }}>
                No courses found
              </p>
            </div>
          )}
        </div>
      </div>
    </PageRoot>
  );
};

export default QuestIndexView;
