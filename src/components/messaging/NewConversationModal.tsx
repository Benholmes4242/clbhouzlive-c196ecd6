import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Users, MessageCircle, Camera } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessaging } from '@/hooks/useMessaging';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
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
  initialTab?: 'direct' | 'group';
}

// Warm input style object shared across all inputs
const warmInputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid rgba(234,88,12,0.08)',
  borderRadius: '12px',
  fontSize: '13px',
  color: '#1C1917',
};

const warmInputClass = "w-full h-10 px-3 outline-none placeholder:text-[13px] placeholder:font-normal focus:ring-2 focus:ring-orange-200/60 transition-shadow";

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
  initialTab,
}: NewConversationModalProps) {
  const { user } = useSupabaseSession();
  const { getOrCreateDM, createGroupChat } = useMessaging();
  
  const [mode, setMode] = useState<'direct' | 'group'>('direct');
  
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
  
  // Group avatar state
  const [groupAvatarFile, setGroupAvatarFile] = useState<File | null>(null);
  const [groupAvatarPreview, setGroupAvatarPreview] = useState<string | null>(null);
  const groupAvatarInputRef = useRef<HTMLInputElement>(null);

  // Handle avatar selection
  const handleGroupAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setGroupAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setGroupAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

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

  useEffect(() => {
    if (!open) {
      setMode('direct');
    } else if (initialTab) {
      setMode(initialTab);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) {
      setDmSearch('');
      setDmResults([]);
      setGroupSearch('');
      setGroupResults([]);
      setGroupName('');
      setSelectedUsers([]);
      setGroupAvatarFile(null);
      setGroupAvatarPreview(null);
      setCreatingDmWith(null);
      setCreatingGroup(false);
    }
  }, [open]);

  const handleClose = () => {
    onOpenChange(false);
  };

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
      let avatarUrl: string | undefined;
      if (groupAvatarFile) {
        const fileExt = groupAvatarFile.name.split('.').pop();
        const fileName = `group-${Date.now()}.${fileExt}`;
        const filePath = `group-avatars/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, groupAvatarFile);
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          avatarUrl = publicUrl;
        }
      }
      const participantIds = selectedUsers.map(u => u.id);
      const conversationId = await createGroupChat(groupName.trim(), participantIds, avatarUrl);
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
    <div
      role="button"
      tabIndex={0}
      key={userProfile.id}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!isLoading) onClick();
        }
      }}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left active:scale-[0.98] transition-transform",
        "hover:bg-white/40 cursor-pointer",
        isLoading && "opacity-50 pointer-events-none",
        isSelected && "bg-white/50"
      )}
    >
      {showCheckbox && (
        <Checkbox checked={isSelected} className="pointer-events-none" />
      )}
      <SquircleAvatar
        src={userProfile.profile_photo_url}
        alt={userProfile.display_name || userProfile.username || 'User'}
        size={40}
        fallback={getInitials(userProfile.display_name, userProfile.username)}
        hideRing
      />
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold truncate" style={{ color: '#1C1917' }}>
          {userProfile.display_name || userProfile.username || 'Unknown User'}
        </p>
        {userProfile.username && (
          <p className="text-[13px] truncate" style={{ color: '#A8A29E' }}>
            @{userProfile.username}
          </p>
        )}
      </div>
      {isLoading && (
        <Loader2 className="h-4 w-4 animate-spin" style={{ color: '#A8A29E' }} />
      )}
    </div>
  );

  const renderEmptyState = (searchQuery: string, loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#A8A29E' }} />
        </div>
      );
    }

    if (searchQuery.trim()) {
      return (
        <div className="text-center py-8">
          <p className="text-[14px]" style={{ color: '#78716C' }}>No users found</p>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <Search className="h-8 w-8 mx-auto mb-2" style={{ color: '#EA580C', opacity: 0.3 }} />
        <p className="text-[14px] font-normal" style={{ color: '#78716C' }}>
          Search for users to start a conversation
        </p>
      </div>
    );
  };

  const isGroupValid = groupName.trim() && selectedUsers.length > 0;

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      className="flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF5EB 40%, #FFECD2 100%)',
        borderRadius: '20px 20px 0 0',
      }}
      ariaLabelledBy="new-message-title"
    >
      <div className="flex flex-col h-[85vh]">
        {/* Header */}
        <div className="px-5 pb-3">
          <h2
            id="new-message-title"
            className="text-[17px] font-bold text-center font-dm-sans"
            style={{ color: '#1C1917' }}
          >
            New Message
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 pb-4">
          <div
            className="flex rounded-xl p-1"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(234,88,12,0.08)',
            }}
          >
            <button
              onClick={() => setMode('direct')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] transition-all",
                mode === 'direct'
                  ? "font-semibold shadow-sm"
                  : "font-medium"
              )}
              style={{
                background: mode === 'direct' ? 'rgba(255,255,255,0.8)' : 'transparent',
                color: mode === 'direct' ? '#1C1917' : '#78716C',
              }}
            >
              <MessageCircle size={18} />
              Direct Message
            </button>
            <button
              onClick={() => setMode('group')}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-[13px] transition-all",
                mode === 'group'
                  ? "font-semibold shadow-sm"
                  : "font-medium"
              )}
              style={{
                background: mode === 'group' ? 'rgba(255,255,255,0.8)' : 'transparent',
                color: mode === 'group' ? '#1C1917' : '#78716C',
              }}
            >
              <Users size={18} />
              Group Chat
            </button>
          </div>
        </div>

        {/* DM Content */}
        {mode === 'direct' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 pb-3">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: '#A8A29E' }}
                />
                <input
                  placeholder="Search by name or username…"
                  value={dmSearch}
                  onChange={(e) => setDmSearch(e.target.value)}
                  className={warmInputClass}
                  style={{ ...warmInputStyle, paddingLeft: '36px' }}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-5 pb-4">
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
          </div>
        )}

        {/* Group Content */}
        {mode === 'group' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="px-5 space-y-3 pb-3">
              {/* Group Avatar Picker */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div
                    onClick={() => groupAvatarInputRef.current?.click()}
                    className="flex items-center justify-center cursor-pointer transition-colors overflow-hidden active:scale-[0.97]"
                    style={{
                      width: '80px',
                      aspectRatio: '1 / 1.05',
                      borderRadius: '34%',
                      border: '2px dashed rgba(234,88,12,0.25)',
                      background: groupAvatarPreview ? 'transparent' : 'rgba(234,88,12,0.05)',
                    }}
                  >
                    {groupAvatarPreview ? (
                      <img src={groupAvatarPreview} alt="Group" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center">
                        <Camera size={24} style={{ color: '#EA580C' }} />
                        <span className="text-[11px] font-medium mt-1" style={{ color: '#EA580C' }}>
                          Add Photo
                        </span>
                      </div>
                    )}
                  </div>
                  {groupAvatarPreview && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupAvatarFile(null);
                        setGroupAvatarPreview(null);
                      }}
                      className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground shadow-md"
                      style={{ borderRadius: '34%' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
                <input
                  ref={groupAvatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleGroupAvatarSelect}
                  className="hidden"
                />
              </div>

              <input
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className={warmInputClass}
                style={warmInputStyle}
              />

              {/* Selected Users Pills */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(userProfile => (
                    <Badge
                      key={userProfile.id}
                      variant="secondary"
                      className="gap-1 pr-1 py-1"
                      style={{
                        background: 'rgba(255,255,255,0.7)',
                        border: '1px solid rgba(234,88,12,0.12)',
                      }}
                    >
                      <SquircleAvatar
                        src={userProfile.profile_photo_url}
                        alt={userProfile.display_name || userProfile.username || 'User'}
                        size={20}
                        fallback={getInitials(userProfile.display_name, userProfile.username)}
                        hideRing
                      />
                      <span className="max-w-[100px] truncate text-[13px]" style={{ color: '#1C1917' }}>
                        {userProfile.display_name || userProfile.username}
                      </span>
                      <button
                        onClick={() => handleRemoveUser(userProfile.id)}
                        className="ml-1 p-0.5 rounded-full hover:bg-white/60"
                      >
                        <X className="h-3 w-3" style={{ color: '#78716C' }} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={16}
                  style={{ color: '#A8A29E' }}
                />
                <input
                  placeholder="Search users to add…"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                  className={warmInputClass}
                  style={{ ...warmInputStyle, paddingLeft: '36px' }}
                />
              </div>
            </div>

            <ScrollArea className="flex-1 px-5">
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

            <div className="p-5 pb-8">
              <button
                onClick={handleCreateGroup}
                disabled={!isGroupValid || creatingGroup}
                className={cn(
                  "w-full h-[48px] flex items-center justify-center gap-2 text-[14px] font-semibold transition-all active:scale-[0.97]",
                )}
                style={{
                  borderRadius: '14px',
                  background: isGroupValid ? '#EA580C' : 'rgba(234,88,12,0.08)',
                  color: isGroupValid ? '#FFFFFF' : 'rgba(234,88,12,0.35)',
                }}
              >
                {creatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Create Group {selectedUsers.length > 0 && `(${selectedUsers.length} members)`}
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
