
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ActionsDropdownProps {
  friendStatus: 'pending' | 'accepted' | null;
  loading: boolean;
  onRemoveFriend: () => void;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  friendStatus,
  loading,
  onRemoveFriend
}) => {
  const { toast } = useToast();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {friendStatus === 'accepted' && (
          <DropdownMenuItem onClick={onRemoveFriend} disabled={loading}>
            Remove Friend
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => {
          toast({
            title: "Coming soon",
            description: "Block user functionality will be available soon.",
          });
        }}>
          Block User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          toast({
            title: "Coming soon", 
            description: "Report user functionality will be available soon.",
          });
        }}>
          Report User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ActionsDropdown;
