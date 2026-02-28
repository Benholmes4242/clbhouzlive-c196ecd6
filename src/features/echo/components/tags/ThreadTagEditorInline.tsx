import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { TagChip } from './TagChip';
import { TagInput } from './TagInput';
import { setTagsForThread, removeTagFromThread } from '../../api/tags';
import { trackTagsSet, trackTagRemoved } from '../../analytics/tags';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Edit2, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThreadTagEditorInlineProps {
  threadId: string;
  initialTags: string[];
  className?: string;
}

export function ThreadTagEditorInline({ threadId, initialTags, className }: ThreadTagEditorInlineProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [isEditing, setIsEditing] = useState(false);
  const [originalTags, setOriginalTags] = useState<string[]>(initialTags);
  
  const queryClient = useQueryClient();

  // Update local state when initialTags changes
  useEffect(() => {
    setTags(initialTags);
    setOriginalTags(initialTags);
  }, [initialTags]);

  const handleSave = async () => {
    try {
      await setTagsForThread(threadId, tags);
      
      // Track analytics
      trackTagsSet({
        thread_id: threadId,
        count: tags.length,
        source: 'inline',
      });
      
      // Optimistic update: update cache immediately
      queryClient.setQueryData(['echoHistorySearch'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((thread: any) => 
          thread.thread_id === threadId 
            ? { ...thread, tags } 
            : thread
        );
      });

      setOriginalTags(tags);
      setIsEditing(false);
      
      toast.success("Tags updated");
    } catch (error) {
      console.error('Failed to save tags:', error);
      toast.error("Couldn't save tags");
      
      // Revert on error
      setTags(originalTags);
      
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
    }
  };

  const handleCancel = () => {
    setTags(originalTags);
    setIsEditing(false);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      const newTags = tags.filter((t) => t !== tagToRemove);
      setTags(newTags);

      // Track analytics
      trackTagRemoved({
        thread_id: threadId,
        tag: tagToRemove,
        source: 'inline',
      });

      // Optimistic update
      queryClient.setQueryData(['echoHistorySearch'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((thread: any) => 
          thread.thread_id === threadId 
            ? { ...thread, tags: newTags } 
            : thread
        );
      });

      await removeTagFromThread(threadId, tagToRemove);
      setOriginalTags(newTags);
    } catch (error) {
      console.error('Failed to remove tag:', error);
      toast.error("Couldn't remove tag");
      
      // Revert on error
      setTags(originalTags);
      queryClient.invalidateQueries({ queryKey: ['echoHistorySearch'] });
    }
  };

  if (isEditing) {
    return (
      <div className={cn("flex items-start gap-2", className)}>
        <TagInput 
          value={tags} 
          onChange={setTags} 
          onSubmit={handleSave}
          autoFocus
          className="flex-1"
        />
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleSave}
            className="h-8 w-8 p-0"
            title="Save tags"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      {tags.length > 0 ? (
        <>
          {tags.map((tag, index) => (
            <TagChip 
              key={index} 
              label={tag} 
              onRemove={() => handleRemoveTag(tag)}
              variant="outline"
            />
          ))}
        </>
      ) : (
        <span className="text-sm text-muted-foreground">No tags</span>
      )}
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={() => setIsEditing(true)}
        className="h-7 px-2 text-xs"
      >
        <Edit2 className="h-3 w-3 mr-1" />
        Edit tags
      </Button>
    </div>
  );
}
