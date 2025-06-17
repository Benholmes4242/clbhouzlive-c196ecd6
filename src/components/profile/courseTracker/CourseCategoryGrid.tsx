
import React from "react";
import { Progress } from "@/components/ui/progress";
import { courseCategories } from "./constants";

interface CourseCategoryGridProps {
  trackerStats: { [cat: string]: number };
  totalStats: { [cat: string]: number };
  onCategoryClick: (categoryKey: string) => void;
}

const CourseCategoryGrid: React.FC<CourseCategoryGridProps> = ({
  trackerStats,
  totalStats,
  onCategoryClick
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {courseCategories.map(cat => {
        const played = trackerStats[cat.key] || 0;
        const total = totalStats[cat.key] || 100;
        const percentage = Math.round((played / total) * 100);
        
        return (
          <div 
            key={cat.key} 
            className="bg-muted/70 rounded-lg p-4 cursor-pointer hover:bg-muted/90 transition-colors"
            onClick={() => onCategoryClick(cat.key)}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{cat.label}</span>
              <span className="text-xs font-semibold">{played} / {total}</span>
            </div>
            <Progress value={percentage} className="mt-2" />
          </div>
        );
      })}
    </div>
  );
};

export default CourseCategoryGrid;
