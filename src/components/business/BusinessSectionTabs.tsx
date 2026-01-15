import { Building2, MapPin, Camera, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BusinessSectionId = 'info' | 'location' | 'branding' | 'verification';

interface BusinessSectionTabsProps {
  activeSection: BusinessSectionId;
  onSectionChange: (section: BusinessSectionId) => void;
  completedSections: string[];
}

const SECTIONS = [
  { id: 'info' as const, icon: Building2, label: 'Business Info' },
  { id: 'location' as const, icon: MapPin, label: 'Location' },
  { id: 'branding' as const, icon: Camera, label: 'Branding' },
  { id: 'verification' as const, icon: Shield, label: 'Verification' },
];

export function BusinessSectionTabs({ 
  activeSection, 
  onSectionChange,
  completedSections 
}: BusinessSectionTabsProps) {
  return (
    <div className="flex justify-center gap-2 px-4 py-3 bg-white border-b border-[#e2e8f0]">
      {SECTIONS.map(({ id, icon: Icon, label }) => {
        const isActive = activeSection === id;
        const isCompleted = completedSections.includes(id);
        
        return (
          <button
            key={id}
            onClick={() => onSectionChange(id)}
            aria-label={label}
            aria-selected={isActive}
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center transition-all",
              isActive 
                ? "bg-[#1e293b] text-white shadow-sm" 
                : isCompleted
                  ? "bg-[#FFF7ED] text-[#F79E1B] border border-[#FDBA74]/30"
                  : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0]"
            )}
          >
            <Icon className="w-5 h-5" />
          </button>
        );
      })}
    </div>
  );
}
