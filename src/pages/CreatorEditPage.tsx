import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { ArrowLeft, Loader2, Save, User, ImageIcon, X, Camera } from 'lucide-react';
import { PageRoot } from '@/components/layout/PageRoot';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useCreatorImageUpload } from '@/hooks/useCreatorImageUpload';

const CreatorEditPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useSupabaseSession();
  
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    slug: '',
    bio: '',
    location_city: '',
    location_country: '',
  });

  // Image state
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Fetch creator page by slug
  const { data: creatorPage, isLoading } = useQuery({
    queryKey: ['creator-page', slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_pages')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data;
    },
  });

  // Image upload hook
  const { 
    uploadAvatar, 
    uploadCover, 
    removeAvatar, 
    removeCover,
    uploadingAvatar, 
    uploadingCover 
  } = useCreatorImageUpload(creatorPage?.id);

  // Check if user can edit
  const { data: canEdit } = useQuery({
    queryKey: ['creator-can-edit', creatorPage?.id, user?.id],
    enabled: !!creatorPage?.id && !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('creator_members')
        .select('role')
        .eq('creator_page_id', creatorPage!.id)
        .eq('user_profile_id', user!.id)
        .single();
      
      if (error) return false;
      return ['owner', 'admin', 'editor'].includes(data?.role);
    },
  });

  // Update form when data loads
  useEffect(() => {
    if (creatorPage) {
      setFormData({
        display_name: creatorPage.display_name || '',
        slug: creatorPage.slug || '',
        bio: creatorPage.bio || '',
        location_city: creatorPage.location_city || '',
        location_country: creatorPage.location_country || '',
      });
      setAvatarPreview(creatorPage.avatar_url || null);
      setCoverPreview(creatorPage.cover_url || null);
    }
  }, [creatorPage]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && creatorPage?.id) {
      // Show preview immediately
      setAvatarPreview(URL.createObjectURL(file));
      // Upload
      const url = await uploadAvatar(file);
      if (url) {
        setAvatarPreview(url);
      }
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && creatorPage?.id) {
      // Show preview immediately
      setCoverPreview(URL.createObjectURL(file));
      // Upload
      const url = await uploadCover(file);
      if (url) {
        setCoverPreview(url);
      }
    }
  };

  const handleRemoveAvatar = async () => {
    await removeAvatar();
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const handleRemoveCover = async () => {
    await removeCover();
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!creatorPage?.id) return;
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('creator_pages')
        .update({
          display_name: formData.display_name.trim(),
          bio: formData.bio.trim() || null,
          location_city: formData.location_city.trim() || null,
          location_country: formData.location_country.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', creatorPage.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['creator-page', slug] });
      await queryClient.invalidateQueries({ queryKey: ['my-creators'] });

      toast.success('Changes saved!');
    } catch (error: any) {
      console.error('Error saving creator page:', error);
      toast.error(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </PageRoot>
    );
  }

  if (!creatorPage) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-muted-foreground mb-4">Creator page not found</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </PageRoot>
    );
  }

  if (canEdit === false) {
    return (
      <PageRoot className="min-h-screen flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-muted-foreground mb-4">You don't have permission to edit this page</p>
          <Button variant="outline" onClick={() => navigate(-1)}>Go back</Button>
        </div>
      </PageRoot>
    );
  }

  return (
    <PageRoot className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-xl px-4 pt-3 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <h1 className="text-xl font-semibold text-center">Edit Creator Page</h1>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-6">
        {/* Cover Image */}
        <div className="space-y-2">
          <Label>Cover Image</Label>
          {coverPreview ? (
            <div className="relative">
              <img 
                src={coverPreview} 
                alt="Cover" 
                className="w-full h-32 rounded-lg object-cover"
              />
              {uploadingCover && (
                <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-white" />
                </div>
              )}
              <div className="absolute top-2 right-2 flex gap-2">
                <label className="cursor-pointer p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input 
                    ref={coverInputRef}
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleCoverChange}
                    disabled={uploadingCover}
                  />
                </label>
                <button 
                  type="button"
                  onClick={handleRemoveCover}
                  disabled={uploadingCover}
                  className="p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          ) : (
            <label className="cursor-pointer block">
              <div className="w-full h-32 rounded-lg bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center hover:bg-muted/80 transition-colors">
                {uploadingCover ? (
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-1.5" />
                    <span className="text-xs text-muted-foreground">Click to upload cover image</span>
                  </>
                )}
              </div>
              <input 
                ref={coverInputRef}
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleCoverChange}
                disabled={uploadingCover}
              />
            </label>
          )}
        </div>

        {/* Avatar */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar" 
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-white" />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-muted rounded-lg text-sm font-medium hover:bg-muted/80 transition-colors">
                  <Camera className="w-4 h-4" />
                  {avatarPreview ? 'Change' : 'Upload'}
                </span>
                <input 
                  ref={avatarInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarChange}
                  disabled={uploadingAvatar}
                />
              </label>
              {avatarPreview && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveAvatar}
                  disabled={uploadingAvatar}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="display_name">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
            placeholder="Your creator name"
          />
        </div>

        {/* Slug (read-only for now) */}
        <div className="space-y-2">
          <Label htmlFor="slug">Username / URL</Label>
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground mr-1">@</span>
            <Input
              id="slug"
              value={formData.slug}
              disabled
              className="bg-muted/50"
            />
          </div>
          <p className="text-xs text-muted-foreground">Username cannot be changed yet</p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
            placeholder="Tell people about yourself..."
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">{formData.bio.length}/500</p>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location_city">City</Label>
            <Input
              id="location_city"
              value={formData.location_city}
              onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
              placeholder="e.g., London"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="location_country">Country</Label>
            <Input
              id="location_country"
              value={formData.location_country}
              onChange={(e) => setFormData(prev => ({ ...prev, location_country: e.target.value }))}
              placeholder="e.g., UK"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={saving || uploadingAvatar || uploadingCover}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </main>
    </PageRoot>
  );
};

export default CreatorEditPage;