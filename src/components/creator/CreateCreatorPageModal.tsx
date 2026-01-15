import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, User, ImageIcon, X, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { uploadCreatorImage } from '@/hooks/useCreatorImageUpload';

interface CreateCreatorPageModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateCreatorPageModal({ open, onClose }: CreateCreatorPageModalProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [bio, setBio] = useState('');
  
  // Image upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const clearAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarInputRef.current) avatarInputRef.current.value = '';
  };

  const clearCover = () => {
    setCoverFile(null);
    setCoverPreview(null);
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCreate = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsCreating(true);
    try {
      // Generate a temp ID for file paths
      const tempId = crypto.randomUUID();
      
      // Upload images first if provided
      let avatarUrl: string | null = null;
      let coverUrl: string | null = null;
      
      if (avatarFile) {
        avatarUrl = await uploadCreatorImage(avatarFile, 'avatar', tempId);
      }
      
      if (coverFile) {
        coverUrl = await uploadCreatorImage(coverFile, 'cover', tempId);
      }

      const { data, error } = await supabase.rpc('create_creator_page', {
        p_display_name: displayName.trim(),
        p_slug: slug.trim() || null,
        p_bio: bio.trim() || null,
        p_avatar_url: avatarUrl,
      });

      if (error) throw error;

      // Parse result
      let result: { page_id: string; slug: string } | null = null;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch {
          result = null;
        }
      } else {
        result = data as { page_id: string; slug: string } | null;
      }

      // If we have a cover URL, update the page (RPC might not support it)
      if (result?.page_id && coverUrl) {
        await supabase
          .from('creator_pages')
          .update({ cover_url: coverUrl })
          .eq('id', result.page_id);
      }

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['my-creators'] });

      toast.success('Creator page created!');
      handleClose();
      
      // Navigate to the new creator page
      if (result?.slug) {
        navigate(`/creator/${result.slug}`);
      }
    } catch (error: any) {
      console.error('Error creating creator page:', error);
      toast.error(error.message || 'Failed to create creator page');
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setDisplayName('');
      setSlug('');
      setBio('');
      clearAvatar();
      clearCover();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Creator Page
          </DialogTitle>
          <DialogDescription>
            Set up your creator identity to share content and build your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverPreview ? (
              <div className="relative">
                <img 
                  src={coverPreview} 
                  alt="Cover preview" 
                  className="w-full h-28 rounded-lg object-cover"
                />
                <button 
                  type="button"
                  onClick={clearCover}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer block">
                <div className="w-full h-28 rounded-lg bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center hover:bg-muted/80 transition-colors">
                  <ImageIcon className="w-6 h-6 text-muted-foreground mb-1.5" />
                  <span className="text-xs text-muted-foreground">Click to upload cover image</span>
                </div>
                <input 
                  ref={coverInputRef}
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleCoverChange}
                />
              </label>
            )}
          </div>

          {/* Avatar Upload */}
          <div className="space-y-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {avatarPreview ? (
                  <img 
                    src={avatarPreview} 
                    alt="Avatar preview" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                {avatarPreview && (
                  <button 
                    type="button"
                    onClick={clearAvatar}
                    className="absolute -top-1 -right-1 p-1 bg-black/60 rounded-full hover:bg-black/80 transition-colors"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
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
                />
              </label>
            </div>
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">
              Display Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your creator name"
              maxLength={50}
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">
              Username / URL
            </Label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-1">@</span>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="your-name"
                maxLength={30}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Leave blank to auto-generate from your display name
            </p>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">
              Bio
            </Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell people about yourself..."
              className="min-h-[80px] resize-none"
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/300
            </p>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleCreate}
            disabled={isCreating || !displayName.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Page'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}