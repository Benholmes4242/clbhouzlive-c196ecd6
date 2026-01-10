import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

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

  const handleCreate = async () => {
    if (!displayName.trim()) {
      toast.error('Display name is required');
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase.rpc('create_creator_page', {
        p_display_name: displayName.trim(),
        p_slug: slug.trim() || null,
        p_bio: bio.trim() || null,
        p_avatar_url: null,
      });

      if (error) throw error;

      // Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['my-creators'] });

      toast.success('Creator page created!');
      onClose();
      
      // Navigate to the new creator page
      // RPC returns JSON with page_id and slug - parse if string
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
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Creator Page
          </DialogTitle>
          <DialogDescription>
            Set up your creator identity to share content and build your audience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
