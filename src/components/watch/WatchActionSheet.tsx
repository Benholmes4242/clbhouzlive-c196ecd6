import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Bookmark, Share2, EyeOff, Flag } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useUcpSignal } from './hooks/useUcpSignal';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';

interface WatchActionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: FeedPost | null;
  userId: string | undefined;
  onShare?: (post: FeedPost) => void;
  onReport?: (post: FeedPost) => void;
}

/**
 * Long-press action sheet for Watch tiles.
 * Save / Share / Not interested / Report — Session 3 Part 2.
 */
export default function WatchActionSheet({
  open,
  onOpenChange,
  post,
  userId,
  onShare,
  onReport,
}: WatchActionSheetProps) {
  const { record } = useUcpSignal(userId);

  const handleSave = async () => {
    if (!post || !userId) return;
    haptic('light');
    await record({ postId: post.id, signalType: 'saved' });
    toast.success('Saved');
    onOpenChange(false);
  };

  const handleShare = () => {
    if (!post) return;
    haptic('light');
    onShare?.(post);
    onOpenChange(false);
  };

  const handleNotInterested = async () => {
    if (!post || !userId) return;
    haptic('medium');
    await record({ postId: post.id, signalType: 'dismissed' });
    toast.success("We'll show you less like this");
    onOpenChange(false);
  };

  const handleReport = () => {
    if (!post) return;
    haptic('light');
    onReport?.(post);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-0 p-0"
        style={{ background: '#F8FAFC', maxHeight: '50vh' }}
      >
        <div className="flex justify-center pt-2 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        <div className="flex flex-col py-2">
          <ActionRow icon={<Bookmark size={20} />} label="Save" onClick={handleSave} />
          <ActionRow icon={<Share2 size={20} />} label="Share" onClick={handleShare} />
          <ActionRow
            icon={<EyeOff size={20} />}
            label="Not interested"
            sublabel="We'll show you less like this"
            onClick={handleNotInterested}
          />
          <ActionRow
            icon={<Flag size={20} />}
            label="Report"
            danger
            onClick={handleReport}
          />
        </div>

        <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
      </SheetContent>
    </Sheet>
  );
}

function ActionRow({
  icon,
  label,
  sublabel,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 px-5 py-4 active:bg-slate-100 transition-colors text-left"
      style={{ borderBottom: '0.5px solid rgba(0,0,0,0.06)' }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: '#fff',
          border: '0.5px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: danger ? '#DC2626' : '#0F172A',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: danger ? '#DC2626' : '#0F172A',
            lineHeight: 1.2,
          }}
        >
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, lineHeight: 1.3 }}>
            {sublabel}
          </div>
        )}
      </div>
    </button>
  );
}
