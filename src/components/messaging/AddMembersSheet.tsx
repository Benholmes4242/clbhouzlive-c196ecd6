import React, { useState, useEffect } from 'react';
import { Search, Check, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';
import { AppLog } from '@/lib/logger';

interface AddMembersSheetProps {
  isOpen: boolean;
  onClose: () => void;
  conversationId: string;
  existingMemberIds: string[];
  onMembersAdded: () => void;
}

interface UserResult {
  id: string;
  username: string;
  display_name: string | null;
  profile_photo_url: string | null;
}

export const AddMembersSheet: React.FC<AddMembersSheetProps> = ({
  isOpen,
  onClose,
  conversationId,
  existingMemberIds,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 300);

  useEffect(() => {
    if (debouncedSearch.length >= 2) {
      searchUsers();
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const searchUsers = async () => {
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('id, username, display_name, profile_photo_url')
        .or(`username.ilike.%${debouncedSearch}%,display_name.ilike.%${debouncedSearch}%`)
        .not('id', 'in', `(${existingMemberIds.join(',')})`)
        .limit(20);
        
      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      AppLog.error('[AddMembersSheet]', 'Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const toggleUser = (user: UserResult) => {
    setSelectedUsers(prev => {
      const isSelected = prev.some(u => u.id === user.id);
      if (isSelected) {
        return prev.filter(u => u.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const handleAddMembers = async () => {
    if (selectedUsers.length === 0) return;
    
    setIsAdding(true);
    try {
      const { data, error } = await supabase.rpc('add_group_members', {
        p_conversation_id: conversationId,
        p_user_ids: selectedUsers.map(u => u.id),
      });
      
      if (error) throw error;
      
      toast.success(`${data} member${data !== 1 ? 's' : ''} added`);
      
      setSelectedUsers([]);
      setSearchQuery('');
      onMembersAdded();
      onClose();
    } catch (error: any) {
      toast.error("Couldn't add members", { description: error.message });
    } finally {
      setIsAdding(false);
    }
  };

  const getInitials = (user: UserResult) => {
    const name = user.display_name || user.username || '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <BottomSheet
      open={isOpen}
      onClose={onClose}
    >
      <div className="p-4 space-y-4">
        {/* Drag handle */}
        <div style={{ width: 36, height: 4, borderRadius: 99, background: '#e2e8f0', margin: '0 auto 8px' }} />
        <h2 className="text-lg font-semibold text-foreground mb-4">Add Members</h2>
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="pl-10 border border-amber-200/30 focus:border-amber-300 focus:ring-1 focus:ring-amber-200"
          />
        </div>
        
        {/* Selected Users */}
        {selectedUsers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map(user => (
              <div
                key={user.id}
                className="flex items-center gap-2 px-3 py-1 rounded-full text-sm"
                style={{ background: 'rgba(247,147,30,0.10)', color: '#c2770f' }}
              >
                <span>{user.display_name || user.username}</span>
                <button 
                  onClick={() => toggleUser(user)}
                  className="hover:opacity-80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        
        {/* Search Results */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {isSearching ? (
            <div className="text-center py-8 text-muted-foreground">Searching...</div>
          ) : searchResults.length > 0 ? (
            searchResults.map(user => {
              const isSelected = selectedUsers.some(u => u.id === user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg transition-colors active:scale-[0.97]",
                    isSelected ? "bg-[rgba(247,147,30,0.05)]" : "hover:bg-muted"
                  )}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.profile_photo_url || undefined} />
                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{user.display_name || user.username}</div>
                    {user.display_name && (
                      <div className="text-sm text-muted-foreground">@{user.username}</div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#F7931E' }}>
                      <Check size={14} className="text-white" />
                    </div>
                  )}
                </button>
              );
            })
          ) : searchQuery.length >= 2 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Search for users to add to this group
            </div>
          )}
        </div>
        
        {/* Add Button */}
        {selectedUsers.length > 0 && (
          <Button 
            onClick={handleAddMembers}
            disabled={isAdding}
            className="w-full"
          >
            <UserPlus size={18} className="mr-2" />
            Add {selectedUsers.length} Member{selectedUsers.length !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    </BottomSheet>
  );
};
