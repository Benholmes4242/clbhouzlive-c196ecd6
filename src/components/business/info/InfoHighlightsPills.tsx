/**
 * InfoHighlightsPills - Glass pills with expand behavior on tap
 */
import React, { useState } from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { Flag, CircleDot, ShoppingBag, Grip, Users, Trophy, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoHighlightsPillsProps {
  business: BusinessProfile;
}

interface HighlightItem {
  key: string;
  label: string;
  icon: React.ElementType;
  description: string;
}

const HIGHLIGHT_DATA: HighlightItem[] = [
  { key: 'golf-club', label: 'Golf Club', icon: Flag, description: 'Full membership facilities and clubhouse' },
  { key: '18-hole', label: '18-hole course', icon: Flag, description: 'Championship-length 18-hole layout' },
  { key: '9-hole', label: '9-hole course', icon: Flag, description: 'Compact 9-hole course' },
  { key: 'driving-range', label: 'Driving range', icon: CircleDot, description: 'Practice your long game' },
  { key: 'pro-shop', label: 'Pro shop', icon: ShoppingBag, description: 'Equipment and apparel available' },
  { key: 'practice', label: 'Practice facilities', icon: Grip, description: 'Putting green and short game area' },
  { key: 'lessons', label: 'Golf lessons', icon: Users, description: 'Professional instruction available' },
  { key: 'tournaments', label: 'Tournaments', icon: Trophy, description: 'Regular competitive events' },
  { key: 'simulator', label: 'Golf simulator', icon: Target, description: 'Indoor simulator bays' },
];

export function InfoHighlightsPills({ business }: InfoHighlightsPillsProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  
  // Build highlights from category + defaults
  const highlights: HighlightItem[] = [
    business.category && HIGHLIGHT_DATA.find(h => h.label.toLowerCase() === business.category?.toLowerCase()),
    HIGHLIGHT_DATA.find(h => h.key === '18-hole'),
    HIGHLIGHT_DATA.find(h => h.key === 'driving-range'),
    HIGHLIGHT_DATA.find(h => h.key === 'pro-shop'),
  ].filter(Boolean) as HighlightItem[];

  // Remove duplicates
  const uniqueHighlights = highlights.filter((h, i, arr) => 
    arr.findIndex(x => x.key === h.key) === i
  );

  if (uniqueHighlights.length === 0) return null;

  const expandedItem = uniqueHighlights.find(h => h.key === expandedKey);

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Highlights
      </h3>
      
      <div className="flex flex-wrap gap-2">
        {uniqueHighlights.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedKey === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => setExpandedKey(isExpanded ? null : item.key)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all duration-200 active:scale-95"
              style={{
                background: isExpanded 
                  ? 'rgba(31,36,40,0.08)' 
                  : 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(31,36,40,0.08)',
                boxShadow: isExpanded 
                  ? 'none' 
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <Icon className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-text-primary font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
      
      {/* Expanded description */}
      <AnimatePresence>
        {expandedItem && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-text-secondary pt-1 pl-1">
              {expandedItem.description}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
