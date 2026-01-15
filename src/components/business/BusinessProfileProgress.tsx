import { cn } from '@/lib/utils';

interface BusinessProfileProgressProps {
  completedFields: number;
  totalFields: number;
  nextStep: string;
}

export function BusinessProfileProgress({ 
  completedFields, 
  totalFields, 
  nextStep 
}: BusinessProfileProgressProps) {
  const percentage = Math.round((completedFields / totalFields) * 100);
  
  return (
    <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] border border-[#FDBA74]/30">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-[#1e293b]">
            Set up your business
          </h3>
          <p className="text-xs text-[#64748b]">
            {completedFields} of {totalFields} sections complete
          </p>
        </div>
        <span className="text-2xl font-bold text-[#F79E1B]">
          {percentage}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-[#F79E1B] rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Next step hint */}
      <p className="text-xs text-[#92400e]">
        Next: {nextStep}
      </p>
    </div>
  );
}
