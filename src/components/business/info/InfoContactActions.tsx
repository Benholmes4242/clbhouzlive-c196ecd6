/**
 * InfoContactActions - Single row with Website, Call, Email
 */
import React from 'react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { Globe, Phone, Mail } from 'lucide-react';
import { toast } from 'sonner';

interface InfoContactActionsProps {
  business: BusinessProfile;
}

interface ContactAction {
  key: string;
  icon: React.ElementType;
  label: string;
  value: string;
  action: () => void;
  copyValue: string;
}

export function InfoContactActions({ business }: InfoContactActionsProps) {
  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http') 
        ? business.website 
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleCall = () => {
    if (business.phone) {
      window.location.href = `tel:${business.phone}`;
    }
  };

  const handleEmail = () => {
    if (business.email) {
      window.location.href = `mailto:${business.email}`;
    }
  };

  const handleLongPress = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const actions: ContactAction[] = [
    business.website && {
      key: 'website',
      icon: Globe,
      label: 'Website',
      value: business.website.replace(/^https?:\/\//, '').replace(/\/$/, '').split('/')[0],
      action: handleWebsite,
      copyValue: business.website,
    },
    business.phone && {
      key: 'call',
      icon: Phone,
      label: 'Call',
      value: business.phone,
      action: handleCall,
      copyValue: business.phone,
    },
    business.email && {
      key: 'email',
      icon: Mail,
      label: 'Email',
      value: business.email,
      action: handleEmail,
      copyValue: business.email,
    },
  ].filter(Boolean) as ContactAction[];

  if (actions.length === 0) return null;

  return (
    <section className="space-y-2">
      <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        Contact
      </h3>
      
      <div 
        className="flex divide-x rounded-sq-md overflow-hidden"
        style={{
          background: 'white',
          border: '1px solid rgba(31,36,40,0.08)',
        }}
      >
        {actions.map((action) => {
          const Icon = action.icon;
          
          return (
            <button
              key={action.key}
              onClick={action.action}
              onContextMenu={(e) => {
                e.preventDefault();
                handleLongPress(action.copyValue, action.label);
              }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3.5 px-2 hover:bg-surface-alt active:bg-surface-alt transition-colors"
            >
              <Icon className="h-5 w-5 text-text-secondary" />
              <span className="text-xs font-medium text-text-primary">{action.label}</span>
            </button>
          );
        })}
      </div>
      
      <p className="text-[11px] text-text-tertiary text-center">
        Long press to copy
      </p>
    </section>
  );
}
