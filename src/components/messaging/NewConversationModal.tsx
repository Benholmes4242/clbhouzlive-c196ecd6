import { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Users, MessageCircle, Camera, Check, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useMessagingContext } from '@/contexts/MessagingContext';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  profile_photo_url: string | null;
  eg_handicap_index?: number | null;
  home_club?: string | null;
}

interface NewConversationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConversationCreated: (conversationId: string) => void;
  initialTab?: 'direct' | 'group';
}

export function NewConversationModal({
  open,
  onOpenChange,
  onConversationCreated,
  initialTab,
}: NewConversationModalProps) {
  const { user } = useSupabaseSession();
  const { getOrCreateDM, createGroupChat } = useMessagingContext();
  
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
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
          .or(`username.ilike.%${dmSearch}%,display_name.ilike.%${dmSearch}%`)
          .neq('id', user.id)
          .limit(20);
        if (error) throw error;
        setDmResults((data || []) as unknown as UserProfile[]);
      } catch {
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
          .from('user_profiles')
          .select('id, username, display_name, profile_photo_url, eg_handicap_index, home_club')
          .or(`username.ilike.%${groupSearch}%,display_name.ilike.%${groupSearch}%`)
          .not('id', 'in', `(${excludeIds.join(',')})`)
          .limit(20);
        if (error) throw error;
        setGroupResults((data || []) as unknown as UserProfile[]);
      } catch {
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

  const handleClose = () => onOpenChange(false);

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




  const isGroupValid = groupName.trim() && selectedUsers.length > 0;

  // Shared search bar component
  const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
    <div
      className="flex items-center"
      style={{
        margin: '0 16px 10px',
        background: '#f8fafc', borderRadius: 12,
        padding: '9px 13px', gap: 8,
        border: '1px solid rgba(0,0,0,0.07)',
      }}
    >
      <Search size={14} style={{ color: '#94a3b8', flexShrink: 0 }} />
      <input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 bg-transparent outline-none"
        style={{ fontSize: '13.5px', color: '#1e293b', border: 'none' }}
      />
      {value && (
        <button onClick={() => onChange('')}>
          <X size={13} style={{ color: '#94a3b8' }} />
        </button>
      )}
    </div>
  );

  // DM user row
  const renderDmUserRow = (userProfile: UserProfile, index: number, total: number) => {
    const isLoading = creatingDmWith === userProfile.id;
    return (
      <div key={userProfile.id}>
        <button
          onClick={() => !isLoading && handleCreateDM(userProfile.id)}
          disabled={isLoading}
          className="w-full flex items-center text-left active:bg-[rgba(247,147,30,0.04)]"
          style={{
            gap: 12, padding: '10px 20px',
            border: 'none', background: 'transparent', cursor: isLoading ? 'default' : 'pointer',
            opacity: isLoading ? 0.5 : 1,
          }}
        >
          <SquircleAvatar
            src={userProfile.profile_photo_url}
            alt={userProfile.display_name || userProfile.username || 'User'}
            userId={userProfile.id}
            size={44}
            hideRing
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center" style={{ gap: 6 }}>
              <span className="truncate" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
                {userProfile.display_name || userProfile.username || 'Unknown User'}
              </span>
            </div>
            <div className="flex items-center" style={{ gap: 6, marginTop: 2 }}>
              {userProfile.username && (
                <span style={{ fontSize: 12, color: '#94a3b8' }}>@{userProfile.username}</span>
              )}
              {userProfile.eg_handicap_index != null && (
                <span
                  style={{
                    fontSize: '10.5px', fontWeight: 600, color: '#F7931E',
                    background: 'rgba(247,147,30,0.08)',
                    border: '1px solid rgba(247,147,30,0.20)',
                    borderRadius: 99, padding: '0 6px',
                  }}
                >
                  HCP {userProfile.eg_handicap_index}
                </span>
              )}
              {userProfile.home_club && (
                <span
                  className="flex items-center truncate"
                  style={{
                    fontSize: '10.5px', fontWeight: 600, color: '#006747',
                    background: 'rgba(0,103,71,0.07)',
                    border: '1px solid rgba(0,103,71,0.18)',
                    borderRadius: 99, padding: '0 6px',
                    gap: 3, maxWidth: 120,
                  }}
                >
                  <MapPin size={10} />
                  {userProfile.home_club}
                </span>
              )}
            </div>
          </div>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" style={{ color: '#F7931E' }} />
          ) : (
            <span
              className="flex-shrink-0"
              style={{
                padding: '5px 12px', borderRadius: 99,
                background: 'rgba(247,147,30,0.10)',
                border: '1px solid rgba(247,147,30,0.25)',
                fontSize: 12, fontWeight: 600, color: '#F7931E',
              }}
            >
              Message →
            </span>
          )}
        </button>
        {index < total - 1 && (
          <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.06)', margin: '0 20px' }} />
        )}
      </div>
    );
  };

  // Group user row with checkbox
  const renderGroupUserRow = (userProfile: UserProfile, index: number, total: number) => {
    const isSelected = selectedUsers.some(u => u.id === userProfile.id);
    return (
      <div key={userProfile.id}>
        <button
          onClick={() => isSelected ? handleRemoveUser(userProfile.id) : handleSelectUser(userProfile)}
          className="w-full flex items-center text-left active:bg-[rgba(247,147,30,0.04)]"
          style={{
            gap: 12, padding: '10px 20px',
            border: 'none', cursor: 'pointer',
            background: isSelected ? 'rgba(247,147,30,0.06)' : 'transparent',
          }}
        >
          {/* Checkbox circle */}
          <div
            className="flex items-center justify-center flex-shrink-0"
            style={{
              width: 22, height: 22, borderRadius: '50%',
              ...(isSelected
                ? { background: '#F7931E', border: 'none' }
                : { background: 'transparent', border: '2px solid #cbd5e1' }
              ),
            }}
          >
            {isSelected && (
              <Check size={12} style={{ color: '#fff' }} strokeWidth={3} />
            )}
          </div>
          
          <SquircleAvatar
            src={userProfile.profile_photo_url}
            alt={userProfile.display_name || userProfile.username || 'User'}
            userId={userProfile.id}
            size={44}
            hideRing
          />
          <div className="flex-1 min-w-0">
            <span className="truncate block" style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>
              {userProfile.display_name || userProfile.username || 'Unknown User'}
            </span>
            {userProfile.username && (
              <span style={{ fontSize: 12, color: '#94a3b8' }}>@{userProfile.username}</span>
            )}
          </div>
        </button>
        {index < total - 1 && (
          <div style={{ height: '0.5px', background: 'rgba(15,23,42,0.06)', margin: '0 20px' }} />
        )}
      </div>
    );
  };

  const renderNoResults = (searchQuery: string, loading: boolean) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#94a3b8' }} />
        </div>
      );
    }

    if (searchQuery.trim()) {
      return (
        <div className="text-center" style={{ padding: '40px 20px' }}>
          <div
            className="flex items-center justify-center mx-auto"
            style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'rgba(247,147,30,0.10)',
              marginBottom: 12,
            }}
          >
            <Search style={{ color: '#F7931E' }} size={20} />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 4 }}>No one found</p>
          <p style={{ fontSize: 13, color: '#94a3b8' }}>Try a different name or username</p>
        </div>
      );
    }

    return (
      <div className="text-center" style={{ padding: '40px 20px' }}>
        <Search className="mx-auto mb-2" style={{ color: '#94a3b8' }} size={32} />
        <p style={{ fontSize: 13, color: '#94a3b8' }}>Search for users to start a conversation</p>
      </div>
    );
  };

  return (
    <BottomSheet
      open={open}
      onClose={handleClose}
      className="flex flex-col"
      style={{
        borderRadius: '24px 24px 0 0',
        background: '#fff',
      }}
      ariaLabelledBy="new-message-title"
    >
      <div className="flex flex-col" style={{ height: '85vh' }}>
        {/* Drag handle */}
        <div
          style={{
            width: 36, height: 4, borderRadius: 2,
            background: 'rgba(15,23,42,0.12)',
            margin: '10px auto 0',
          }}
        />

        {/* Header */}
        <div className="relative flex items-center justify-center" style={{ padding: '12px 20px 14px', borderBottom: '0.5px solid rgba(15,23,42,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
            <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }} id="new-message-title">
              New Message
            </span>
          </div>
          <button
            onClick={handleClose}
            className="absolute flex items-center justify-center"
            style={{
              right: 16,
              width: 30, height: 30, borderRadius: '50%',
              background: 'rgba(15,23,42,0.05)',
              border: '0.5px solid rgba(15,23,42,0.10)',
              cursor: 'pointer',
            }}
          >
            <X style={{ color: '#64748b' }} size={16} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div
          className="flex"
          style={{
            margin: '0 16px 14px',
            background: 'rgba(15,23,42,0.05)', borderRadius: 12,
            padding: 3, gap: 2,
          }}
        >
          <button
            onClick={() => setMode('direct')}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              gap: 6, padding: '8px 12px', borderRadius: 9,
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              ...(mode === 'direct'
                ? { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { background: 'transparent', color: '#94a3b8' }
              ),
            }}
          >
            <MessageCircle size={16} style={{ color: mode === 'direct' ? '#F7931E' : '#94a3b8' }} />
            Direct Message
          </button>
          <button
            onClick={() => setMode('group')}
            className="flex-1 flex items-center justify-center transition-all"
            style={{
              gap: 6, padding: '8px 12px', borderRadius: 9,
              border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600,
              ...(mode === 'group'
                ? { background: '#fff', color: '#0f172a', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                : { background: 'transparent', color: '#94a3b8' }
              ),
            }}
          >
            <Users size={16} style={{ color: mode === 'group' ? '#F7931E' : '#94a3b8' }} />
            Group Chat
          </button>
        </div>

        {/* DM Content */}
        {mode === 'direct' && (
          <div className="flex-1 flex flex-col min-h-0">
            <SearchInput
              value={dmSearch}
              onChange={setDmSearch}
              placeholder="Search by name or username…"
            />

            {/* Section label */}
            <div style={{ padding: '6px 20px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
              {dmSearch.trim() ? 'Results' : 'Suggested'}
              </span>
            </div>

            <ScrollArea className="flex-1">
              {dmResults.length > 0
                ? dmResults.map((u, i) => renderDmUserRow(u, i, dmResults.length))
                : renderNoResults(dmSearch, dmLoading)
              }
            </ScrollArea>
          </div>
        )}

        {/* Group Content */}
        {mode === 'group' && (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Avatar + Name row */}
            <div className="flex items-center" style={{ gap: 12, padding: '0 16px 12px' }}>
              {/* Avatar picker */}
              <div
                onClick={() => groupAvatarInputRef.current?.click()}
                className="flex flex-col items-center justify-center flex-shrink-0 cursor-pointer overflow-hidden"
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  border: '2px dashed rgba(247,147,30,0.45)',
                  background: groupAvatarPreview ? 'transparent' : 'rgba(247,147,30,0.07)',
                }}
              >
                {groupAvatarPreview ? (
                  <img src={groupAvatarPreview} alt="Group" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Camera size={16} style={{ color: '#F7931E' }} />
                    <span style={{ fontSize: 9, color: '#F7931E', marginTop: 1 }}>Photo</span>
                  </>
                )}
              </div>
              <input
                ref={groupAvatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleGroupAvatarSelect}
                className="hidden"
              />

              {/* Group name */}
              <input
                placeholder="Group name…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="flex-1 outline-none"
                style={{
                  height: 44, borderRadius: 12,
                  background: '#f8fafc',
                  border: '1px solid rgba(15,23,42,0.10)',
                  padding: '0 14px', fontSize: 14, color: '#1e293b',
                }}
              />
            </div>

            {/* Selected member pills */}
            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap" style={{ gap: 6, padding: '0 16px 10px' }}>
                {selectedUsers.map(u => (
                  <div
                    key={u.id}
                    className="flex items-center"
                    style={{
                      gap: 6, padding: '4px 10px 4px 5px',
                      background: 'rgba(247,147,30,0.08)',
                      border: '1px solid rgba(247,147,30,0.22)',
                      borderRadius: 99,
                    }}
                  >
                    <SquircleAvatar
                      src={u.profile_photo_url}
                      alt={u.display_name || u.username || 'User'}
                      userId={u.id}
                      size={22}
                      hideRing
                    />
                    <span
                      className="truncate"
                      style={{
                        fontSize: '12.5px', fontWeight: 600,
                        color: '#c2770f', maxWidth: 80,
                      }}
                    >
                      {(u.display_name || u.username || '').split(' ')[0]}
                    </span>
                    <button
                      onClick={() => handleRemoveUser(u.id)}
                      className="flex items-center justify-center"
                      style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: 'rgba(247,147,30,0.25)',
                        border: 'none', cursor: 'pointer',
                      }}
                    >
                      <X size={10} style={{ color: '#c2770f' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <SearchInput
              value={groupSearch}
              onChange={setGroupSearch}
              placeholder="Search users to add…"
            />

            <ScrollArea className="flex-1">
              {groupResults.length > 0
                ? groupResults.map((u, i) => renderGroupUserRow(u, i, groupResults.length))
                : renderNoResults(groupSearch, groupLoading)
              }
            </ScrollArea>

            {/* Footer CTA */}
            <div
              className="flex-shrink-0"
              style={{
                padding: '10px 16px 20px',
                borderTop: '0.5px solid rgba(15,23,42,0.07)',
              }}
            >
              {/* Member stack */}
              {selectedUsers.length > 0 && (
                <div className="flex items-center justify-center" style={{ gap: 6, marginBottom: 10 }}>
                  <div className="flex items-center">
                    {selectedUsers.slice(0, 5).map((u, i) => (
                      <div
                        key={u.id}
                        className="rounded-full overflow-hidden border-2 border-white"
                        style={{
                          width: 24, height: 24,
                          marginLeft: i > 0 ? -6 : 0,
                        }}
                      >
                        <SquircleAvatar
                          src={u.profile_photo_url}
                          alt={u.display_name || 'User'}
                          userId={u.id}
                          size={24}
                          hideRing
                        />
                      </div>
                    ))}
                  </div>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    {selectedUsers.length} member{selectedUsers.length !== 1 ? 's' : ''} selected
                  </span>
                </div>
              )}

              <button
                onClick={handleCreateGroup}
                disabled={!isGroupValid || creatingGroup}
                className="w-full flex items-center justify-center active:scale-[0.97] transition-transform"
                style={{
                  height: 48, borderRadius: 14,
                  fontSize: '14.5px', fontWeight: 700, gap: 8,
                  cursor: isGroupValid && !creatingGroup ? 'pointer' : 'default',
                  ...(isGroupValid
                    ? {
                        background: '#F7931E',
                        border: 'none',
                        color: '#ffffff',
                        boxShadow: '0 4px 16px rgba(247,147,30,0.28)',
                      }
                    : {
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid transparent',
                        color: '#94a3b8',
                      }
                  ),
                }}
              >
                {creatingGroup ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  <>
                    <Users className="h-4 w-4" />
                    Create Group{selectedUsers.length > 0 ? ` · ${selectedUsers.length + 1}` : ''}
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
