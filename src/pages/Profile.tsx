import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { Button } from '@/components/ui/button';
import ActivityFeed from '@/components/profile/ActivityFeed';
import HandicapGraph from '@/components/profile/HandicapGraph';

const Profile = () => {
  const { userId } = useParams();
  const { user } = useSupabaseSession();
  const [activeSection, setActiveSection] = useState('activity');
  
  // Refs for smooth scrolling
  const activityRef = useRef<HTMLDivElement>(null);
  const handicapRef = useRef<HTMLDivElement>(null);
  const coursesRef = useRef<HTMLDivElement>(null);

  // Mock user data - replace with actual data fetching
  const profileUser = {
    id: userId || user?.id || '',
    name: 'Benjamin Holmes',
    username: 'benjaminholmes',
    homeClub: 'Walton Heath Golf Club',
    avatar: '/lovable-uploads/84a79a37-4fc7-4180-8128-dd7a9b83366f.png',
    coverImage: '/lovable-uploads/84a79a37-4fc7-4180-8128-dd7a9b83366f.png',
    handicap: 4.0,
    postsCount: 142,
    ratedCoursesCount: 32,
    averageRating: 8.6
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    
    switch (section) {
      case 'activity':
        activityRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'handicap':
        handicapRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
      case 'courses':
        coursesRef.current?.scrollIntoView({ behavior: 'smooth' });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section with Cover + Stats Overlay */}
      <div className="relative h-96 overflow-hidden">
        {/* Cover Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=800&h=600&fit=crop)`,
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/60" />
        </div>
        
        {/* Content Overlay */}
        <div className="relative z-10 h-full p-6 flex flex-col">
          {/* Top Stats Bar */}
          <div className="mb-8">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-3 flex items-center justify-center space-x-6 text-white text-sm font-medium max-w-fit mx-auto">
              <span>Handicap 4.0</span>
              <span>142 Posts</span>
              <span>Rated 32 Courses</span>
              <span>Avg. 8.6 / 10</span>
            </div>
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 flex items-end">
            <div className="w-full">
              {/* Profile Picture */}
              <div className="mb-4">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-20 h-20 rounded-full border-4 border-white object-cover"
                />
              </div>
              
              {/* Text Info */}
              <div className="flex justify-between items-end">
                <div>
                  <h1 className="text-white text-3xl font-bold mb-1">
                    {profileUser.name}
                  </h1>
                  <p className="text-white/80 text-lg mb-1">
                    @{profileUser.username}
                  </p>
                  <p className="text-white/70 text-base">
                    {profileUser.homeClub}
                  </p>
                </div>
                
                {/* Edit Profile Button */}
                <Button
                  variant="outline"
                  className="bg-black/30 border-white/40 text-white hover:bg-white/20 backdrop-blur-sm rounded-full px-6"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Three Preview Cards */}
      <div className="p-6 bg-black">
        <div className="flex space-x-4 max-w-4xl mx-auto">
          {/* Activity Card */}
          <div 
            className="flex-1 aspect-square bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl relative cursor-pointer hover:scale-105 transition-transform"
            onClick={() => scrollToSection('activity')}
          >
            <div className="absolute inset-0 bg-black/20 rounded-2xl" />
            <div className="absolute bottom-4 left-4">
              <span className="text-white font-bold text-xl">Activity</span>
            </div>
            <div className="absolute inset-0 bg-cover bg-center rounded-2xl opacity-30"
                 style={{backgroundImage: 'url(https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?w=300&h=300&fit=crop)'}} />
          </div>
          
          {/* Handicap Card */}
          <div 
            className="flex-1 aspect-square bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl relative cursor-pointer hover:scale-105 transition-transform"
            onClick={() => scrollToSection('handicap')}
          >
            <div className="absolute inset-0 bg-black/20 rounded-2xl" />
            <div className="absolute bottom-4 left-4">
              <span className="text-white font-bold text-xl">Handicap</span>
            </div>
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 border-2 border-white/60 rounded"></div>
            </div>
            <div className="absolute inset-0 bg-cover bg-center rounded-2xl opacity-30"
                 style={{backgroundImage: 'url(https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=300&h=300&fit=crop)'}} />
          </div>
          
          {/* Scottie Card */}
          <div className="flex-1 aspect-square bg-gradient-to-br from-green-600 to-green-700 rounded-2xl relative cursor-pointer hover:scale-105 transition-transform">
            <div className="absolute inset-0 bg-black/20 rounded-2xl" />
            <div className="absolute bottom-4 left-4">
              <span className="text-white font-bold text-xl">Scottie</span>
            </div>
            <div className="absolute top-4 right-4">
              <div className="w-6 h-6 border-2 border-white/60 rounded"></div>
            </div>
            <div className="absolute inset-0 bg-cover bg-center rounded-2xl opacity-30"
                 style={{backgroundImage: 'url(https://images.unsplash.com/photo-1587174486073-ae5e5cec4689?w=300&h=300&fit=crop)'}} />
          </div>
        </div>
      </div>
      
      {/* Main Content with Navigation */}
      <div className="bg-black text-white">
        {/* Floating Navigation Pills */}
        <div className="sticky top-0 z-30 px-6 py-4 bg-black/90 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-4xl mx-auto flex justify-center">
            <div className="bg-gray-800/80 rounded-full p-1 backdrop-blur-sm">
              <div className="flex space-x-1">
                {[
                  { id: 'activity', label: 'Activity' },
                  { id: 'handicap', label: 'Handicap' },
                  { id: 'courses', label: 'Top 100' }
                ].map((section) => (
                  <Button
                    key={section.id}
                    variant={activeSection === section.id ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => scrollToSection(section.id)}
                    className={`rounded-full px-6 transition-all ${
                      activeSection === section.id
                        ? 'bg-white text-black hover:bg-white/90'
                        : 'text-white/80 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {section.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 space-y-16 pb-24">
          {/* Top 100 Courses Section */}
          <div ref={coursesRef} className="scroll-mt-32">
            <h2 className="text-3xl font-bold text-white mb-8">Top 100 Courses</h2>
            
            {/* Clubhouse Index Card */}
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🏆</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Clubhouse</h3>
                    <h3 className="font-semibold text-white text-lg -mt-1">index</h3>
                    <p className="text-orange-400 font-medium">32 Ratings</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center text-yellow-500 text-sm mb-1">
                    <span className="mr-1">✨</span>
                  </div>
                  <span className="text-yellow-500 font-medium">📍 Ko'H</span>
                </div>
              </div>
            </div>
            
            {/* Achievement Badges Row */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { name: '20 Club', count: 'Rated 50', detail: 'Top 100 cs', color: 'bg-orange-600' },
                { name: '50 Club', count: 'Rated 56', detail: 'Top co cs', color: 'bg-blue-600' },
                { name: '75 Club', count: 'Rated 25', detail: 'Top courses', color: 'bg-yellow-600' },
                { name: '200 Club', count: 'Rater 200', detail: 'Top co/cs', color: 'bg-orange-500' }
              ].map((badge, index) => (
                <div key={index} className="text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${badge.color}`}>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-white font-medium text-sm">{badge.name}</p>
                  <p className="text-gray-400 text-xs">{badge.count}</p>
                  <p className="text-gray-400 text-xs">{badge.detail}</p>
                </div>
              ))}
            </div>
            
            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trump Turnberry Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="aspect-video relative">
                  <img
                    src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop"
                    alt="Trump Turnberry Resort"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                    9/10
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Trump Turnberry Resort -</h3>
                  <h3 className="text-white font-bold text-lg -mt-2 mb-3">Ailsa</h3>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>📍</span>
                    <span>Walton Heath Golf Club</span>
                  </div>
                </div>
              </div>
              
              {/* Old Head Golf Links Card */}
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-colors">
                <div className="aspect-video relative">
                  <img
                    src="https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=400&h=300&fit=crop"
                    alt="Old Head Golf Links"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full font-bold text-sm">
                    10/10
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-3">Old Head Golf Links</h3>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm mb-2">
                    <span>📍</span>
                    <span>I ckrol cx</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>⭐</span>
                    <span>Rated all Top 100 courses</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Activity Section */}
          <div ref={activityRef} className="scroll-mt-32">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Activity</h2>
            </div>
            <ActivityFeed userId={profileUser.id} isOwnProfile={!userId || userId === user?.id} />
          </div>
          
          {/* Handicap Section */}
          <div ref={handicapRef} className="scroll-mt-32">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white">Handicap</h2>
            </div>
            <HandicapGraph userId={profileUser.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;