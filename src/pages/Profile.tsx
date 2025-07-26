import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import ProfileHeaderRedesign from '@/components/profile/ProfileHeaderRedesign';
import StatBar from '@/components/profile/StatBar';
import HighlightCarousel from '@/components/profile/HighlightCarousel';
import FloatingNav from '@/components/profile/FloatingNav';
import ActivityFeed from '@/components/profile/ActivityFeed';
import HandicapGraph from '@/components/profile/HandicapGraph';
import CourseGrid from '@/components/profile/CourseGrid';
import BadgeCards from '@/components/profile/BadgeCards';

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
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <ProfileHeaderRedesign user={profileUser} isOwnProfile={!userId || userId === user?.id} />
      
      {/* Floating Stat Bar */}
      <StatBar 
        handicap={profileUser.handicap}
        postsCount={profileUser.postsCount}
        ratedCoursesCount={profileUser.ratedCoursesCount}
        averageRating={profileUser.averageRating}
      />
      
      {/* Highlight Reel */}
      <HighlightCarousel userId={profileUser.id} />
      
      {/* Floating Navigation */}
      <FloatingNav 
        activeSection={activeSection}
        onSectionChange={scrollToSection}
      />
      
      {/* Content Sections */}
      <div className="px-4 space-y-6 pb-24">
        {/* Activity Section */}
        <div ref={activityRef} className="scroll-mt-32">
          <ActivityFeed userId={profileUser.id} isOwnProfile={!userId || userId === user?.id} />
        </div>
        
        {/* Handicap Section */}
        <div ref={handicapRef} className="scroll-mt-32">
          <HandicapGraph userId={profileUser.id} />
        </div>
        
        {/* Top 100 Courses Section */}
        <div ref={coursesRef} className="scroll-mt-32">
          <CourseGrid userId={profileUser.id} />
        </div>
        
        {/* Badges & Achievements */}
        <BadgeCards userId={profileUser.id} />
      </div>
    </div>
  );
};

export default Profile;