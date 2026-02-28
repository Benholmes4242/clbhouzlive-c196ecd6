import React, { useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

interface ActionsDropdownProps {
  friendStatus: 'pending' | 'accepted' | null;
  loading: boolean;
  onRemoveFriend: () => void;
  username: string;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  friendStatus,
  loading,
  onRemoveFriend,
  username
}) => {
  
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Blur trigger on close to prevent stuck focus ring
  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      // Small timeout to ensure blur happens after close animation
      requestAnimationFrame(() => {
        triggerRef.current?.blur();
      });
    }
  }, []);

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button 
          ref={triggerRef}
          variant="outline" 
          size="sm" 
          className="px-2 py-1 h-7 w-7 flex-shrink-0 focus:ring-0 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem disabled className="text-muted-foreground cursor-default">
          {username}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {friendStatus === 'accepted' && (
          <DropdownMenuItem onClick={onRemoveFriend} disabled={loading}>
            Remove Friend
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => {
          toast.info("Coming soon", { description: "Block user functionality will be available soon." });
        }}>
          Block User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          toast.info("Coming soon", { description: "Report user functionality will be available soon." });
        }}>
          Report User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionsDropdown;
