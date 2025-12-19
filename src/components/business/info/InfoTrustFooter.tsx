/**
 * InfoTrustFooter - Minimal trust & status footer
 */
import React from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { BadgeCheck, Calendar, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface InfoTrustFooterProps {
  business: BusinessProfile;
}

export function InfoTrustFooter({ business }: InfoTrustFooterProps) {
  const memberSince = business.created_at 
    ? format(new Date(business.created_at), 'MMMM yyyy')
    : null;

  const items = [
    business.is_verified && {
      icon: BadgeCheck,
      text: 'Verified by Clbhouz',
      highlight: true,
    },
    memberSince && {
      icon: Calendar,
      text: `Member since ${memberSince}`,
      highlight: false,
    },
    business.category && {
      icon: Tag,
      text: business.category,
      highlight: false,
    },
  ].filter(Boolean) as { icon: React.ElementType; text: string; highlight: boolean }[];

  if (items.length === 0) return null;

  return (
    <footer className="pt-4 border-t border-border-subtle">
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div 
              key={idx}
              className="flex items-center gap-2"
            >
              <Icon 
                className={`h-3.5 w-3.5 ${
                  item.highlight ? 'text-emerald-600' : 'text-text-tertiary'
                }`} 
              />
              <span className={`text-xs ${
                item.highlight 
                  ? 'text-emerald-600 font-medium' 
                  : 'text-text-tertiary'
              }`}>
                {item.text}
              </span>
            </div>
          );
        })}
      </div>
    </footer>
  );
}
