import { Switch } from '@/components/ui/switch';
import { Globe, Lock } from 'lucide-react';

interface Props {
  isPublic: boolean;
  onChange: (v: boolean) => void;
}

export function PrivacySection({ isPublic, onChange }: Props) {
  return (
    <div
      className="flex items-center justify-between min-h-[56px] cursor-pointer"
      onClick={() => onChange(!isPublic)}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
          style={{
            backgroundColor: isPublic ? 'rgba(247,147,30,0.10)' : 'rgba(15,23,42,0.06)',
          }}
        >
          {isPublic
            ? <Globe size={18} style={{ color: '#F7931E' }} />
            : <Lock size={18} className="text-muted-foreground" />
          }
        </div>
        <div>
          <p className="text-[15px] font-semibold text-foreground">
            {isPublic ? 'Public Profile' : 'Private Profile'}
          </p>
          <p className="text-[12px] text-muted-foreground">
            {isPublic
              ? 'Anyone can view your profile and posts'
              : 'Only approved followers can see your content'
            }
          </p>
        </div>
      </div>
      <Switch
        checked={isPublic}
        onCheckedChange={onChange}
        onClick={(e) => e.stopPropagation()}
        className="data-[state=checked]:bg-[#F7931E]"
      />
    </div>
  );
}