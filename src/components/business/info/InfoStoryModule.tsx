/**
 * InfoStoryModule - Collapsible about/story section with structured content
 */
import React, { useState } from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface InfoStoryModuleProps {
  business: BusinessProfile;
}

export function InfoStoryModule({ business }: InfoStoryModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!business.description) return null;

  // Split description into lines for structured display
  const lines = business.description.split('\n').filter(Boolean);
  const openingLine = lines[0] || '';
  const hasMoreContent = lines.length > 1 || openingLine.length > 120;
  
  // Truncate opening line if too long
  const displayOpening = openingLine.length > 120 && !isExpanded
    ? openingLine.slice(0, 117) + '...'
    : openingLine;

  return (
    <section className="space-y-3">
      {/* Opening line - larger */}
      <p className="text-[15px] font-medium text-text-primary leading-relaxed">
        {displayOpening}
      </p>
      
      {/* Collapsed preview */}
      {!isExpanded && lines.length > 1 && (
        <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
          {lines.slice(1, 3).join(' ')}
        </p>
      )}
      
      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-1">
              {/* Remaining content */}
              {lines.slice(1).map((line, idx) => (
                <p key={idx} className="text-sm text-text-secondary leading-relaxed">
                  {line}
                </p>
              ))}
              
              {/* Structured micro-sections */}
              <div className="pt-3 space-y-3 border-t border-border-subtle">
                {business.category && (
                  <div>
                    <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                      What it is
                    </p>
                    <p className="text-sm text-text-secondary">
                      {business.category} in {business.city || 'the area'}
                    </p>
                  </div>
                )}
                
                <div>
                  <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide mb-1">
                    What you can do here
                  </p>
                  <ul className="text-sm text-text-secondary space-y-1">
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                      Share Moments
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                      Explore Courses
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-text-tertiary" />
                      Connect with Golfers
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Read more / Read less toggle */}
      {hasMoreContent && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm font-medium text-primary-accent active:opacity-70 transition-opacity"
        >
          {isExpanded ? 'Read less' : 'Read more'}
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-4 w-4" />
          </motion.span>
        </button>
      )}
    </section>
  );
}
