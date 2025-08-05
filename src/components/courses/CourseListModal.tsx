import React, { useState, useMemo } from 'react';
import { Search, MapPin, Star, CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as Dialog from '@radix-ui/react-dialog';

interface Course {
  id: string;
  name: string;
  location: string;
  difficulty: number;
  isPlayed: boolean;
}

interface CourseListModalProps {
  isOpen: boolean;
  onClose: () => void;
  region: {
    id: string;
    name: string;
    completed: number;
    total: number;
  };
}

// Mock course data - in real app this would come from props or API
const generateMockCourses = (regionId: string, total: number, completed: number): Course[] => {
  const courses: Course[] = [];
  
  for (let i = 1; i <= total; i++) {
    const isPlayed = i <= completed;
    
    let locationPrefix = '';
    switch (regionId) {
      case 'britain-ireland':
        locationPrefix = i % 2 === 0 ? 'Scotland' : 'England';
        break;
      case 'europe':
        locationPrefix = ['Spain', 'Portugal', 'France', 'Ireland'][i % 4];
        break;
      case 'usa':
        locationPrefix = ['California', 'Florida', 'New York', 'Texas'][i % 4];
        break;
      case 'worldwide':
        locationPrefix = ['Australia', 'Japan', 'South Africa', 'Canada'][i % 4];
        break;
      default:
        locationPrefix = 'Location';
    }
    
    courses.push({
      id: `${regionId}-${i}`,
      name: `Course ${i}`,
      location: `${locationPrefix}, Region`,
      difficulty: Math.floor(Math.random() * 5) + 1,
      isPlayed
    });
  }
  
  return courses;
};

export const CourseListModal: React.FC<CourseListModalProps> = ({
  isOpen,
  onClose,
  region
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'location' | 'difficulty'>('name');
  
  // Early return if region is null to prevent crashes
  if (!region) {
    return null;
  }
  
  const courses = useMemo(() => 
    generateMockCourses(region.id, region.total, region.completed),
    [region.id, region.total, region.completed]
  );
  
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses.filter(course =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.location.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'location':
          return a.location.localeCompare(b.location);
        case 'difficulty':
          return b.difficulty - a.difficulty;
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [courses, searchTerm, sortBy]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-full max-w-2xl h-[80vh] bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden z-50">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10 rounded-xl" />
          
          <div className="relative flex flex-col h-full z-10">
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center justify-between mb-4">
                <Dialog.Title className="text-2xl font-bold text-white">
                  Top {region.total} {region.name} Courses
                </Dialog.Title>
                <button
                  onClick={onClose}
                  className="text-white/60 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* Search and Sort */}
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'name' | 'location' | 'difficulty')}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/30"
                >
                  <option value="name">Sort by Name</option>
                  <option value="location">Sort by Location</option>
                  <option value="difficulty">Sort by Difficulty</option>
                </select>
              </div>
            </div>
            
            {/* Course List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-3">
                {filteredAndSortedCourses.map((course) => (
                  <div
                    key={course.id}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg border transition-all',
                      course.isPlayed
                        ? 'bg-green-500/20 border-green-400/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    )}
                  >
                    <div className="flex-shrink-0">
                      {course.isPlayed ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-white/30" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-white">{course.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/60">{course.location}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-4 h-4',
                            i < course.difficulty
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-white/20'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Footer Stats */}
            <div className="p-6 border-t border-white/10">
              <div className="flex justify-between text-sm text-white/80">
                <span>Courses Played: {region.completed}/{region.total}</span>
                <span>✨ XP: {region.completed * 110}</span>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};