import React, { useState } from 'react';
import { MapPin } from 'lucide-react';

interface CourseHighlight {
  id: string;
  name: string;
  location: string;
  rank: string;
  image: string;
}

interface CourseHighlightsCarouselProps {
  userFirstName?: string;
  isOwnProfile?: boolean;
}

const CourseHighlightsCarousel: React.FC<CourseHighlightsCarouselProps> = ({
  userFirstName = 'User',
  isOwnProfile = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Mock data for the course highlights
  const courseHighlights: CourseHighlight[] = [
    {
      id: '1',
      name: 'Ganton Golf Club',
      location: 'England, Yorkshire, Britain & Ireland',
      rank: 'Britain & Ireland #23',
      image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=400&h=300&fit=crop'
    },
    {
      id: '2', 
      name: 'Trump Turnberry Resort - Ailsa',
      location: 'Scotland, Ayrshire & Arran, Britain & Ireland',
      rank: 'Britain & Ireland #5',
      image: 'https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=400&h=300&fit=crop'
    },
    {
      id: '3',
      name: 'Trump Turnberry Resort - Ailsa', 
      location: 'Scotland, Ayrshire & Arran, Britain & Ireland',
      rank: 'Britain & Ireland #5',
      image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Horizontal Scrollable Course Cards */}
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 px-4 [--cards:2.5] md:[--cards:4.5] lg:[--cards:4.5] xl:[--cards:4.5] [--g:1rem] sm:[--g:1rem] md:[--g:1rem] lg:[--g:1rem] xl:[--g:1rem]">
        {courseHighlights.map((course, index) => (
          <div
            key={course.id}
            className={`shrink-0 basis-[calc((100%-((var(--g)*(var(--cards)-1))))/var(--cards))] h-[240px] relative rounded-lg overflow-hidden cursor-pointer transition-transform ${
              index === 0 ? 'ring-4 ring-red-500' : ''
            }`}
            onClick={() => setCurrentIndex(index)}
          >
            {/* Course Image */}
            <img
              src={course.image}
              alt={course.name}
              className="w-full h-full object-cover"
            />

            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

            {/* My Highlights Badge - Top Left */}
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-white/10 backdrop-blur-2xl border border-white/20 rounded-full px-3 py-1.5 shadow-lg">
                <span className="text-black text-xs font-medium">
                  {isOwnProfile ? "My Highlights" : `${userFirstName}'s Highlights`}
                </span>
              </div>
            </div>

            {/* Course Info - Bottom - removed course name and location */}
          </div>
        ))}
      </div>

    </div>
  );
};

export default CourseHighlightsCarousel;