/**
 * ExpandedRegionsSection - Polished region cards (Hub standard)
 * 
 * Uses real course images from top course in each region
 * Features:
 * - Horizontal scroll
 * - Course counts + Top 100 counts
 * - Gradient overlays
 * - Emerald accent line in header
 */

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
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

// Hardcoded image override for specific regions
const REGION_IMAGE_OVERRIDES: Record<string, string> = {
  'rest-of-world': 'https://media.clbhouz.co.uk/e44b8cbe-1d40-48d3-978f-1fa5e250ddde/clbhouz-course-images/1764363996472-9h1ryjq2sre.jpeg', // Royal Melbourne Golf Club - West Course
};

/**
 * Hook to fetch region data with top course image
 * Fix 10: Consolidated into parallel queries instead of sequential per-region
 */
function useRegionsWithTopCourse() {
  return useQuery({
    queryKey: ['regions-with-top-course'],
    queryFn: async (): Promise<RegionData[]> => {
      // Step 1: Fetch all regions + members in parallel
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

      // Build region->countries map
      const regionCountries: Record<string, string[]> = {};
      for (const region of regions) {
        regionCountries[region.id] = allMembers
          .filter(m => m.region_id === region.id)
          .map(m => m.country);
      }

      // Step 2: Fetch all course counts and top100 counts in parallel per region
      const allCountries = allMembers.map(m => m.country);
      const uniqueCountries = [...new Set(allCountries)];

      // Single query for all courses with ranks, then aggregate in JS
      const { data: coursesWithRank } = await supabase
        .from('golf_courses')
        .select('id, country, global_rank, thumbnail_image')
        .in('country', uniqueCountries.length > 0 ? uniqueCountries : ['__none__']);

      const courses = coursesWithRank || [];

      // Build per-region data from the single courses query
      return regions.map(region => {
        const countries = regionCountries[region.id] || [];
        const countriesSet = new Set(countries);
        const regionCourses = courses.filter(c => countriesSet.has(c.country));
        
        const courseCount = regionCourses.length;
        const top100Count = regionCourses.filter(c => c.global_rank != null && c.global_rank <= 100).length;
        
        // Get top course image (best ranked with image)
        const topCourse = regionCourses
          .filter(c => c.global_rank != null && c.thumbnail_image != null)
          .sort((a, b) => (a.global_rank || 999) - (b.global_rank || 999))[0];
        
        const topCourseImage = topCourse?.thumbnail_image || null;

        // Apply region-specific image overrides
        const overrideImage = REGION_IMAGE_OVERRIDES[region.slug];

        return {
          id: region.id,
          slug: region.slug,
          title: region.title,
          hero_image_url: region.hero_image_url,
          course_count: courseCount,
          top100_count: top100Count,
          topCourseImage: overrideImage || topCourseImage,
        };
      });
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Region card component
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
      className="relative w-36 h-24 rounded-xl overflow-hidden flex-shrink-0 group"
    >
      {/* Course Image Background */}
      {!showGradient ? (
        <img
          src={imageUrl!}
          alt={region.title}
          onError={() => setImageError(true)}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-300" />
      )}
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="text-sm font-semibold text-white line-clamp-1">
          {region.title}
        </p>
        <p className="text-[11px] text-white/70">
          {region.course_count} courses
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
      <div className={cn("bg-white border-b border-[#e2e8f0]", className)}>
        <div className="px-4 py-4">
          <div className="h-5 w-32 bg-[#e2e8f0] rounded animate-pulse mb-3" />
          <div className="flex gap-3 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="w-36 h-24 rounded-xl bg-[#e2e8f0] animate-pulse flex-shrink-0" 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!regions || regions.length === 0) return null;

  return (
    <div className={cn("bg-white border-b border-[#e2e8f0]", className)}>
      <div className="px-4 py-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="w-4 h-0.5 bg-emerald-500 rounded-full" />
            <h3 className="text-sm font-semibold text-[#1e293b]">
              Explore by Region
            </h3>
          </div>
          <button 
            onClick={() => navigate('/regions')}
            className="text-xs font-medium text-[#64748b] hover:text-[#1e293b] transition-colors"
          >
            See all
          </button>
        </div>
        
        {/* Horizontal Scroll */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
          {regions.map((region) => (
            <RegionCard
              key={region.id}
              region={region}
              onClick={() => handleRegionClick(region.slug)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpandedRegionsSection;
