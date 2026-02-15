// PostTemplateSelector — One-tap post templates for common post types
import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Video, Trophy, Target, Users } from 'lucide-react';
import { triggerHaptic } from '@/lib/ui/haptics';

export interface PostTemplate {
  id: string;
  label: string;
  emoji: string;
  icon: React.ComponentType<{ className?: string }>;
  categories: string[];
  captionStructure: string;
  badges?: string[];
}

const TEMPLATES: PostTemplate[] = [
  {
    id: 'course-vlog',
    label: 'Course Vlog',
    emoji: '🎬',
    icon: Video,
    categories: ['course-vlog'],
    captionStructure: 'Course: \nConditions: \nHighlights: \nRating: /10',
  },
  {
    id: 'tournament',
    label: 'Tournament',
    emoji: '🏆',
    icon: Trophy,
    categories: ['tournament'],
    captionStructure: 'Event: \nCourse: \nScore: \nHighlights:',
  },
  {
    id: 'hole-in-one',
    label: 'Hole-in-One',
    emoji: '🎯',
    icon: Target,
    categories: ['achievement'],
    captionStructure: 'HOLE IN ONE! 🎯\nCourse: \nHole: \nYards: \nClub:',
    badges: ['hole-in-one'],
  },
  {
    id: 'society-day',
    label: 'Society Day',
    emoji: '👥',
    icon: Users,
    categories: ['society'],
    captionStructure: 'Society: \nCourse: \nWinner: \nBest Moment:',
  },
];

interface PostTemplateSelectorProps {
  onSelectTemplate: (template: PostTemplate) => void;
  onDeselectTemplate: () => void;
  activeTemplateId: string | null;
}

export function PostTemplateSelector({
  onSelectTemplate,
  onDeselectTemplate,
  activeTemplateId,
}: PostTemplateSelectorProps) {
  const handleTap = useCallback((template: PostTemplate) => {
    triggerHaptic('light');
    if (activeTemplateId === template.id) {
      onDeselectTemplate();
    } else {
      onSelectTemplate(template);
    }
  }, [activeTemplateId, onSelectTemplate, onDeselectTemplate]);

  return (
    <div className="w-full">
      {/* Divider with label */}
      <div className="flex items-center gap-3 px-6 mb-3">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs font-medium text-gray-400">or start from a template</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* Scrollable template chips */}
      <div className="flex gap-2 overflow-x-auto px-6 pb-2 -mx-6 scrollbar-hide">
        {TEMPLATES.map((template) => {
          const isActive = activeTemplateId === template.id;
          return (
            <motion.button
              key={template.id}
              onClick={() => handleTap(template)}
              whileTap={{ scale: 0.97 }}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border shadow-sm transition-colors ${
                isActive
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-white border-gray-200 text-gray-700'
              }`}
            >
              <span className="text-base">{template.emoji}</span>
              <span className="text-sm font-medium whitespace-nowrap">{template.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

export default PostTemplateSelector;
