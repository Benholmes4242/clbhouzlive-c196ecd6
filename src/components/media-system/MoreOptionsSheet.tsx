/**
 * MoreOptionsSheet — Three-dot menu bottom sheet for post actions.
 */
import { Flag, EyeOff, Link, Info } from 'lucide-react';
import { toast } from 'sonner';
import { haptic } from '@/utils/haptics';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/drawer';

interface MoreOptionsSheetProps {
  postId: string;
  children: React.ReactNode;
}

const OPTIONS = [
  { icon: Flag, label: 'Report this post', key: 'report' },
  { icon: EyeOff, label: 'Not interested', key: 'not-interested' },
  { icon: Link, label: 'Copy link', key: 'copy-link' },
  { icon: Info, label: 'About this account', key: 'about' },
] as const;

export function MoreOptionsSheet({ postId, children }: MoreOptionsSheetProps) {
  const handleAction = async (key: string) => {
    haptic('light');
    if (key === 'copy-link') {
      const url = `https://clbhouz.com/post/${postId}`;
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } else {
      toast('Coming soon');
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent
        style={{
          background: '#1A1A1A',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255,255,255,0.3)',
            }}
          />
        </div>

        <div className="pb-8 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 32px)' }}>
          {OPTIONS.map(({ icon: Icon, label, key }) => (
            <button
              key={key}
              onClick={() => handleAction(key)}
              className="w-full flex items-center gap-3 py-3.5 px-2 rounded-lg active:bg-white/5 transition-colors"
            >
              <Icon className="w-5 h-5" style={{ color: 'rgba(255,255,255,0.7)' }} />
              <span style={{ fontSize: 15, color: '#FFFFFF' }}>{label}</span>
            </button>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
