/**
 * CategoryPills - Shared horizontal scrolling category filter pills
 * Used across all discovery surfaces: Watch, Videos, Videos Section, Community
 * 
 * Features:
 * - Icons for each category (from MOMENT_CATEGORIES)
 * - Consistent styling with design system
 * - "All" pill always first
 * - Only shows discoverEnabled categories
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { MOMENT_CATEGORIES, getDiscoverCategories } from '@/components/post/create-moment/categoryDefinitions';

interface CategoryPillsProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showIcons?: boolean;
  className?: string;
}

export function CategoryPills({ 
  selectedCategory, 
  onCategoryChange, 
  showIcons = true,
  className 
}: CategoryPillsProps) {
  // Filter to only show categories with discoverEnabled: true
  const discoverCategories = getDiscoverCategories();

  return (
    <div className={cn("flex gap-2 overflow-x-auto px-4 scrollbar-hide no-scrollbar", className)}>
      {/* "All" pill - per spec: active = white bg, #e2e8f0 border, shadow */}
      <button
        onClick={() => onCategoryChange("all")}
        className={cn(
          "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0 border",
          selectedCategory === "all"
            ? "bg-white text-[#1e293b] border-[#e2e8f0] shadow-sm"
            : "bg-[#f1f5f9] text-[#64748b] border-transparent hover:bg-[#e2e8f0]"
        )}
      >
        All
      </button>

      {/* Category pills with icons */}
      {discoverCategories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.id;
        
        return (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              "px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all flex items-center gap-2 flex-shrink-0 border",
              isSelected
                ? "bg-white text-[#1e293b] border-[#e2e8f0] shadow-sm"
                : "bg-[#f1f5f9] text-[#64748b] border-transparent hover:bg-[#e2e8f0]"
            )}
          >
            {showIcons && Icon && <Icon className="h-4 w-4" />}
            {category.label}
          </button>
        );
      })}
    </div>
  );
}

export default CategoryPills;
