/**
 * ExpandedRegionsSection - Premium region cards in horizontal scroll
 * A* Polish: rounded-2xl aspect-[3/2] cards, snap scrolling, clean header
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ExpandedRegionsSectionProps {
  className?: string;
}

interface RegionData {
  id: string;
  slug: string;
  title: string;
  hero_image_url: string | null;
  course_count: number;
  top100_count: number;
  topCourseImage: string | null;
}

const REGION_IMAGE_OVERRIDES: Record<string, string> = {
  'rest-of-world': 'https://media.clbhouz.co.uk/e44b8cbe-1d40-48d3-978f-1fa5e250ddde/clbhouz-course-images/1764363996472-9h1ryjq2sre.jpeg',
};

function useRegionsWithTopCourse() {
  return useQuery({
    queryKey: ['regions-with-top-course'],
    queryFn: async (): Promise<RegionData[]> => {
      const [regionsResult, membersResult] = await Promise.all([
        supabase
          .from('explore_regions')
          .select('id, slug, title, hero_image_url, sort_order')
          .order('sort_order'),
        supabase
          .from('explore_region_members')
          .select('region_id, country'),
      ]);

      if (regionsResult.error || !regionsResult.data) return [];
      const regions = regionsResult.data;
      const allMembers = membersResult.data || [];

      const regionCountries: Record<string, string[]> = {};
      for (const region of regions) {
        regionCountries[region.id] = allMembers
          .filter(m => m.region_id === region.id)
          .map(m => m.country);
      }

      const allCountries = allMembers.map(m => m.country);
      const uniqueCountries = [...new Set(allCountries)];

      const { data: coursesWithRank } = await supabase
        .from('golf_courses')
        .select('id, country, global_rank, thumbnail_image')
        .in('country', uniqueCountries.length > 0 ? uniqueCountries : ['__none__']);

      const courses = coursesWithRank || [];

      return regions.map(region => {
        const countries = regionCountries[region.id] || [];
        const countriesSet = new Set(countries);
        const regionCourses = courses.filter(c => countriesSet.has(c.country));
        
        const courseCount = regionCourses.length;
        const top100Count = regionCourses.filter(c => c.global_rank != null && c.global_rank <= 100).length;
        
        const topCourse = regionCourses
          .filter(c => c.global_rank != null && c.thumbnail_image != null)
          .sort((a, b) => (a.global_rank || 999) - (b.global_rank || 999))[0];
        
        const overrideImage = REGION_IMAGE_OVERRIDES[region.slug];

        return {
          id: region.id,
          slug: region.slug,
          title: region.title,
          hero_image_url: region.hero_image_url,
          course_count: courseCount,
          top100_count: top100Count,
          topCourseImage: overrideImage || topCourse?.thumbnail_image || null,
        };
      });
    },
    staleTime: 10 * 60 * 1000,
  });
}

const RegionCard: React.FC<{
  region: RegionData;
  onClick: () => void;
}> = ({ region, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const imageUrl = region.topCourseImage || region.hero_image_url;
  const showGradient = !imageUrl || imageError;

  return (
    <button
      onClick={onClick}
      className="relative w-[200px] rounded-2xl overflow-hidden flex-shrink-0 group snap-start active:scale-[0.98] transition-transform"
      style={{ aspectRatio: '3/2' }}
    >
      {!showGradient ? (
        <img
          src={imageUrl!}
          alt={region.title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-emerald-900" />
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-base font-semibold text-white line-clamp-1">
          {region.title}
        </p>
        <p className="text-xs text-white/70">
          {region.course_count.toLocaleString()} courses
        </p>
      </div>
    </button>
  );
};

export const ExpandedRegionsSection: React.FC<ExpandedRegionsSectionProps> = ({
  className,
}) => {
  const navigate = useNavigate();
  const { data: regions, isLoading } = useRegionsWithTopCourse();

  const handleRegionClick = (slug: string) => {
    navigate(`/discover/explore/region/${slug}`);
  };

  if (isLoading) {
    return (
      <div className={cn("mt-6 mb-6", className)}>
        <div className="px-4 mb-3 flex items-center justify-between">
          <div className="h-5 w-32 bg-gray-100 rounded animate-pulse" />
          <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className="w-[200px] rounded-2xl bg-gray-100 animate-pulse flex-shrink-0"
              style={{ aspectRatio: '3/2' }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (!regions || regions.length === 0) return null;

  return (
    <div className={cn("mt-6 mb-6", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <h3 className="text-base font-semibold text-gray-700">
          Explore by Region
        </h3>
        <button 
          onClick={() => navigate('/regions')}
          className="text-sm font-medium text-emerald-600"
        >
          See all
        </button>
      </div>
      
      {/* Horizontal Scroll — snap scrolling */}
      <div 
        className="flex gap-3 overflow-x-auto scrollbar-hide px-4"
        style={{
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {regions.map((region) => (
          <RegionCard
            key={region.id}
            region={region}
            onClick={() => handleRegionClick(region.slug)}
          />
        ))}
        {/* Spacer for last card bleed */}
        <div className="w-1 flex-shrink-0" />
      </div>
    </div>
  );
};

export default ExpandedRegionsSection;
