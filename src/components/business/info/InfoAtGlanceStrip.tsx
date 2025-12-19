/**
 * InfoAtGlanceStrip - Horizontal scroll row with key info items
 */
import React, { useState } from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { MapPin, Tag, Calendar, Globe, BadgeCheck } from 'lucide-react';
import { format } from 'date-fns';
import { getCityOnly } from '@/lib/locationDisplay';
import { motion, AnimatePresence } from 'framer-motion';

interface InfoAtGlanceStripProps {
  business: BusinessProfile;
}

interface GlanceItem {
  key: string;
  icon: React.ElementType;
  label: string;
  value: string;
  action?: () => void;
}

export function InfoAtGlanceStrip({ business }: InfoAtGlanceStripProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  
  const city = getCityOnly({ city: business.city, location: business.location });
  const memberSince = business.created_at 
    ? format(new Date(business.created_at), 'MMM yyyy')
    : null;
  const websiteDisplay = business.website
    ? business.website.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0]
    : null;

  const handleWebsiteClick = () => {
    if (business.website) {
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const items: GlanceItem[] = [
    city && { key: 'city', icon: MapPin, label: 'Location', value: city },
    business.category && { key: 'category', icon: Tag, label: 'Category', value: business.category },
    memberSince && { key: 'member', icon: Calendar, label: 'Member since', value: memberSince },
    websiteDisplay && { key: 'website', icon: Globe, label: 'Website', value: websiteDisplay, action: handleWebsiteClick },
    business.is_verified && { key: 'verified', icon: BadgeCheck, label: 'Status', value: 'Verified' },
  ].filter(Boolean) as GlanceItem[];

  const handleItemTap = (item: GlanceItem) => {
    if (item.action) {
      item.action();
    } else {
      setExpandedKey(expandedKey === item.key ? null : item.key);
    }
  };

  return (
    <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
      <div className="flex gap-2 py-3">
        {items.map((item) => {
          const Icon = item.icon;
          const isExpanded = expandedKey === item.key;
          
          return (
            <button
              key={item.key}
              onClick={() => handleItemTap(item)}
              className="flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-full transition-all duration-200 active:scale-95"
              style={{
                background: isExpanded ? 'rgba(31,36,40,0.08)' : 'rgba(31,36,40,0.04)',
                border: '1px solid rgba(31,36,40,0.06)',
              }}
            >
              <Icon className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-xs font-medium text-text-primary whitespace-nowrap">
                {item.value}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Expanded reveal */}
      <AnimatePresence>
        {expandedKey && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="text-xs text-text-secondary pb-2 px-1">
              {items.find(i => i.key === expandedKey)?.label}: {items.find(i => i.key === expandedKey)?.value}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
