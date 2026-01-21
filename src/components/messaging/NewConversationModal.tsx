import { useState, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Users, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
}

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
}

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
}: NewConversationModalProps) {
  const { user } = useSupabaseSession();
  const { getOrCreateDM, createGroupChat } = useMessaging();
  
  // DM tab state
  const [dmSearch, setDmSearch] = useState('');
  const [dmResults, setDmResults] = useState<UserProfile[]>([]);
  const [dmLoading, setDmLoading] = useState(false);
  const [creatingDmWith, setCreatingDmWith] = useState<string | null>(null);
  
  // Group tab state
  const [groupSearch, setGroupSearch] = useState('');
  const [groupResults, setGroupResults] = useState<UserProfile[]>([]);
  const [groupLoading, setGroupLoading] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Debounced search for DM tab
  useEffect(() => {
    if (!dmSearch.trim() || !user) {
      setDmResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setDmLoading(true);
      try {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, username, display_name, profile_photo_url')
          .or(`username.ilike.%${dmSearch}%,display_name.ilike.%${dmSearch}%`)
          .neq('id', user.id)
          .limit(20);

        if (error) throw error;
        setDmResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setDmResults([]);
      } finally {
        setDmLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [dmSearch, user]);

  // Debounced search for Group tab
  useEffect(() => {
    if (!groupSearch.trim() || !user) {
      setGroupResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setGroupLoading(true);
      try {
        const selectedIds = selectedUsers.map(u => u.id);
        const excludeIds = [user.id, ...selectedIds];
        
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, username, display_name, profile_photo_url')
          .or(`username.ilike.%${groupSearch}%,display_name.ilike.%${groupSearch}%`)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(20);

        if (error) throw error;
        setGroupResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        setGroupResults([]);
      } finally {
        setGroupLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [groupSearch, user, selectedUsers]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setDmSearch('');
      setDmResults([]);
      setGroupSearch('');
      setGroupResults([]);
      setGroupName('');
      setSelectedUsers([]);
      setCreatingDmWith(null);
      setCreatingGroup(false);
    }
  }, [open]);

  const handleCreateDM = async (userId: string) => {
    setCreatingDmWith(userId);
    try {
      const conversationId = await getOrCreateDM(userId);
      if (conversationId) {
        onConversationCreated(conversationId);
        onOpenChange(false);
      }
    } finally {
      setCreatingDmWith(null);
    }
  };

  const handleSelectUser = (userProfile: UserProfile) => {
    if (!selectedUsers.find(u => u.id === userProfile.id)) {
      setSelectedUsers([...selectedUsers, userProfile]);
      setGroupSearch('');
      setGroupResults([]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return;
    
    setCreatingGroup(true);
    try {
      const participantIds = selectedUsers.map(u => u.id);
      const conversationId = await createGroupChat(groupName.trim(), participantIds);
      if (conversationId) {
        onConversationCreated(conversationId);
        onOpenChange(false);
      }
    } finally {
      setCreatingGroup(false);
    }
  };

  const getInitials = (name: string | null, username: string | null) => {
    const displayText = name || username || '?';
    return displayText.slice(0, 2).toUpperCase();
  };

  const renderUserItem = (
    userProfile: UserProfile,
    onClick: () => void,
    isLoading: boolean,
    showCheckbox: boolean = false,
    isSelected: boolean = false
  ) => (
    <button
      key={userProfile.id}
      onClick={onClick}
      disabled={isLoading}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
        "hover:bg-muted/50 disabled:opacity-50",
        isSelected && "bg-primary/10"
      )}
    >
      {showCheckbox && (
        <Checkbox checked={isSelected} className="pointer-events-none" />
      )}
      <Avatar className="h-10 w-10 flex-shrink-0">
        <AvatarImage src={userProfile.profile_photo_url || undefined} />
        <AvatarFallback className="bg-muted text-muted-foreground text-sm">
          {getInitials(userProfile.display_name, userProfile.username)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">
          {userProfile.display_name || userProfile.username || 'Unknown User'}
        </p>
        {userProfile.username && (
          <p className="text-sm text-muted-foreground truncate">
            @{userProfile.username}
          </p>
        )}
      </div>
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </button>
  );

  const renderEmptyState = (searchQuery: string, loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      );
    }

    if (searchQuery.trim()) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users found</p>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <Search className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Search for users to start a conversation</p>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-4 pt-4 pb-2">
          <DialogTitle>New Conversation</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="dm" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 grid w-auto grid-cols-2">
            <TabsTrigger value="dm" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Direct Message
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Users className="h-4 w-4" />
              Group Chat
            </TabsTrigger>
          </TabsList>

          {/* DM Tab */}
          <TabsContent value="dm" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username..."
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1 px-4 pb-4">
              <div className="space-y-1">
                {dmResults.length > 0
                  ? dmResults.map(userProfile =>
                      renderUserItem(
                        userProfile,
                        () => handleCreateDM(userProfile.id),
                        creatingDmWith === userProfile.id
                      )
                    )
                  : renderEmptyState(dmSearch, dmLoading)}
              </div>
            </ScrollArea>
          </TabsContent>

          {/* Group Tab */}
          <TabsContent value="group" className="flex-1 flex flex-col min-h-0 mt-4">
            <div className="px-4 space-y-3 pb-3">
              <Input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />

              {/* Selected Users Pills */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userProfile => (
                    <Badge
                      key={userProfile.id}
                      variant="secondary"
                      className="gap-1 pr-1 py-1"
                    >
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={userProfile.profile_photo_url || undefined} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(userProfile.display_name, userProfile.username)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="max-w-[100px] truncate">
                        {userProfile.display_name || userProfile.username}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(userProfile.id)}
                        className="ml-1 p-0.5 rounded-full hover:bg-muted"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users to add..."
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-4">
              <div className="space-y-1">
                {groupResults.length > 0
                  ? groupResults.map(userProfile =>
                      renderUserItem(
                        userProfile,
                        () => handleSelectUser(userProfile),
                        false,
                        true,
                        selectedUsers.some(u => u.id === userProfile.id)
                      )
                    )
                  : renderEmptyState(groupSearch, groupLoading)}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border">
              <Button
                onClick={handleCreateGroup}
                disabled={!groupName.trim() || selectedUsers.length === 0 || creatingGroup}
                className="w-full"
              >
                {creatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4 mr-2" />
                    Create Group {selectedUsers.length > 0 && `(${selectedUsers.length} members)`}
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
