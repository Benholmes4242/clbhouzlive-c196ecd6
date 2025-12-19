import React from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import ExploreHero from './ExploreHero';
import Top100JourneySummary from './Top100JourneySummary';
import RegionExploreRail from './RegionExploreRail';
import ThemeExploreRail from './ThemeExploreRail';
import CourseDiscoveryFeed from './CourseDiscoveryFeed';

interface ExploreTabProps {
  onMediaClick?: (item: any) => void;
  className?: string;
}

/**
 * ExploreTab - The aspirational discovery surface for golf places, courses, and journeys
 * 
 * If:
 * - Watch = inspiration
 * - Learn = improvement
 * Then:
 * - Explore = aspiration & planning
 * 
 * Explore should make users think: "I want to play there."
 * 
 * Explore is:
 * - Place-first
 * - Course-led
 * - Slower
 * - Visual
 * - Aspirational
 * 
 * Think: Condé Nast Travel + Top 100 Golf + Trip-planning energy.
 */
export const ExploreTab: React.FC<ExploreTabProps> = ({
  onMediaClick,
  className,
}) => {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    // Scroll to content below hero
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleStartJourney = () => {
    navigate('/top100');
  };

  const handleContinueJourney = () => {
    navigate('/top100');
  };

  const handleRegionClick = (regionId: string) => {
    console.log('Region clicked:', regionId);
    // Future: navigate to region-specific view
  };

  const handleThemeClick = (themeId: string) => {
    console.log('Theme clicked:', themeId);
    // Future: navigate to theme-specific view
  };

  const handleItemClick = (item: any) => {
    console.log('Course content clicked:', item);
    onMediaClick?.(item);
  };

  return (
    <div className={cn("min-h-screen", className)}>
      {/* Hero Section - Sets aspirational tone */}
      <ExploreHero onExploreClick={handleExploreClick} />
      
      {/* Top 100 Journey Summary - Anchor to long-term goal */}
      <Top100JourneySummary
        onStartJourney={handleStartJourney}
        onContinueJourney={handleContinueJourney}
      />
      
      {/* Divider */}
      <div className="h-px bg-border/40 mx-5" />
      
      {/* Explore by Region */}
      <RegionExploreRail onRegionClick={handleRegionClick} />
      
      {/* Explore by Theme */}
      <ThemeExploreRail onThemeClick={handleThemeClick} />
      
      {/* Divider */}
      <div className="h-px bg-border/40 mx-5" />
      
      {/* Course-Led Discovery Feed */}
      <CourseDiscoveryFeed onItemClick={handleItemClick} />
      
      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  );
};

export default ExploreTab;
