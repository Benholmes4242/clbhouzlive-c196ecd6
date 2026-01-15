import { LucideIcon } from 'lucide-react';

interface BusinessSectionHeaderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function BusinessSectionHeader({ 
  icon: Icon, 
  title, 
  description 
}: BusinessSectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 mb-6">
      {/* Icon in orange circle */}
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border border-[#FDBA74]/30 flex items-center justify-center flex-shrink-0">
        <Icon className="w-5 h-5 text-[#F79E1B]" />
      </div>
      
      <div>
        <h2 className="text-base font-semibold text-[#1e293b]">
          {title}
        </h2>
        <p className="text-sm text-[#64748b]">
          {description}
        </p>
      </div>
    </div>
  );
}
