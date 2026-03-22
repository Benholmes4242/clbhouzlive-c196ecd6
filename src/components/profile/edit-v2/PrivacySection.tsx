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
            backgroundColor: isPublic ? 'rgba(245,166,35,0.12)' : 'hsl(210,15%,93%)',
          }}
        >
          {isPublic
            ? <Globe size={18} className="text-[hsl(38,92%,50%)]" />
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
        className="data-[state=checked]:bg-[hsl(38,92%,50%)]"
      />
    </div>
  );
}
