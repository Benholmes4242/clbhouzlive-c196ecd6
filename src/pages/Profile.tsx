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
      {/* Hero Section with Cover Image */}
      <div className="relative w-full h-screen overflow-hidden">
        {/* Background Cover Image */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(/lovable-uploads/baa8bc95-5f20-424d-808e-deba6aa8be14.png)`,
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/40" />
        </div>
        
        {/* Profile Content Overlay */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Top Stats Bar */}
          <div className="px-6 py-8 pt-16">
            <div className="bg-black/70 backdrop-blur-sm rounded-full px-6 py-4 flex items-center justify-between text-white text-sm font-medium max-w-4xl mx-auto">
              <div className="flex items-center space-x-2">
                <span>Handicap: {profileUser.handicap}</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center space-x-2">
                <span>{profileUser.postsCount} Posts</span>
              </div>
              <div className="w-px h-4 bg-white/30" />
              <div className="flex items-center space-x-2">
                <span>Rated {profileUser.ratedCoursesCount} Courses – Avg: {profileUser.averageRating}/10</span>
              </div>
            </div>
          </div>
          
          {/* Main Profile Info */}
          <div className="flex-1 flex flex-col justify-center px-6">
            <div className="max-w-4xl mx-auto w-full">
              {/* Profile Image */}
              <div className="mb-6">
                <img
                  src={profileUser.avatar}
                  alt={profileUser.name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-2xl object-cover"
                />
              </div>
              
              {/* Name and Info */}
              <div className="space-y-2 mb-6">
                <h1 className="text-4xl font-bold text-white">
                  {profileUser.name}
                </h1>
                <p className="text-white/80 text-lg">
                  @{profileUser.username}
                </p>
                <p className="text-white/70">
                  {profileUser.homeClub}
                </p>
              </div>
              
              {/* Edit Profile Button */}
              <div className="mb-8">
                <Button
                  variant="outline"
                  className="bg-black/30 border-white/30 text-white hover:bg-white/20 backdrop-blur-sm rounded-full px-8"
                >
                  Edit Profile
                </Button>
              </div>
            </div>
          </div>
          
          {/* Highlight Reel at Bottom */}
          <div className="px-6 pb-8">
            <div className="flex space-x-4 max-w-4xl mx-auto">
              {/* Activity Card */}
              <div className="flex-1 aspect-video bg-gradient-to-br from-orange-500/80 to-orange-600/80 rounded-2xl overflow-hidden relative backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-white font-bold text-xl">Activity</span>
                </div>
              </div>
              
              {/* Handicap Card */}
              <div className="flex-1 aspect-video bg-gradient-to-br from-blue-500/80 to-blue-600/80 rounded-2xl overflow-hidden relative backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-white font-bold text-xl">Handicap</span>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 border-2 border-white/50 rounded"></div>
                </div>
              </div>
              
              {/* Scottie Card */}
              <div className="flex-1 aspect-video bg-gradient-to-br from-green-500/80 to-green-600/80 rounded-2xl overflow-hidden relative backdrop-blur-sm">
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute bottom-4 left-4">
                  <span className="text-white font-bold text-xl">Scottie</span>
                </div>
                <div className="absolute top-4 right-4">
                  <div className="w-6 h-6 border-2 border-white/50 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Sections */}
      <div className="bg-black text-white">
        {/* Floating Navigation */}
        <div className="sticky top-0 z-30 px-6 py-4 bg-black/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto flex justify-center">
            <div className="bg-gray-800 rounded-full p-1">
              <div className="flex space-x-1">
                {['activity', 'handicap', 'courses'].map((section) => (
                  <Button
                    key={section}
                    variant={activeSection === section ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => scrollToSection(section)}
                    className={`rounded-full px-6 capitalize ${
                      activeSection === section
                        ? 'bg-white text-black'
                        : 'text-white hover:text-black hover:bg-white/20'
                    }`}
                  >
                    {section === 'courses' ? 'Top 100' : section}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto px-6 space-y-12 pb-24">
          {/* Top 100 Courses Section */}
          <div ref={coursesRef} className="scroll-mt-32">
            <h2 className="text-3xl font-bold text-white mb-8">Top 100 Courses</h2>
            
            {/* Clubhouse Index */}
            <div className="bg-gray-900 rounded-2xl p-6 mb-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Clubhouse Index</h3>
                  <p className="text-gray-400">32 Ratings</p>
                </div>
                <div className="ml-auto">
                  <span className="text-yellow-500">📍 Ko'H</span>
                </div>
              </div>
            </div>
            
            {/* Badge Row */}
            <div className="flex space-x-4 mb-8">
              {[
                { name: '20 Club', rating: '50', courses: 'Top 100 cs', tier: 'bronze' },
                { name: '50 Club', rating: '56', courses: 'Top co cs', tier: 'silver' },
                { name: '75 Club', rating: '25', courses: 'Top courses', tier: 'gold' },
                { name: '200 Club', rating: '200', courses: 'Top co/cs', tier: 'orange' }
              ].map((badge, index) => (
                <div key={index} className="flex-1 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-2 ${
                    badge.tier === 'bronze' ? 'bg-orange-600' :
                    badge.tier === 'silver' ? 'bg-blue-600' :
                    badge.tier === 'gold' ? 'bg-yellow-600' : 'bg-orange-500'
                  }`}>
                    <span className="text-2xl">🏆</span>
                  </div>
                  <p className="text-white font-medium text-sm">{badge.name}</p>
                  <p className="text-gray-400 text-xs">Rated {badge.rating}</p>
                  <p className="text-gray-400 text-xs">{badge.courses}</p>
                </div>
              ))}
            </div>
            
            {/* Course Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trump Turnberry */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src="https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=300&fit=crop"
                    alt="Trump Turnberry Resort"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                    9/10
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Trump Turnberry Resort - Ailsa</h3>
                  <div className="flex items-center space-x-2 text-gray-400 text-sm">
                    <span>📍</span>
                    <span>Walton Heath Golf Club</span>
                  </div>
                </div>
              </div>
              
              {/* Old Head Golf Links */}
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src="https://images.unsplash.com/photo-1559267200-f29d6297a4ac?w=400&h=300&fit=crop"
                    alt="Old Head Golf Links"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 bg-green-600 text-white px-3 py-1 rounded-full font-bold">
                    10/10
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-white font-bold text-lg mb-2">Old Head Golf Links</h3>
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
            <ActivityFeed userId={profileUser.id} isOwnProfile={!userId || userId === user?.id} />
          </div>
          
          {/* Handicap Section */}
          <div ref={handicapRef} className="scroll-mt-32">
            <HandicapGraph userId={profileUser.id} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;