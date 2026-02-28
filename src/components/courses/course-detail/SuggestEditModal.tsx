import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface SuggestEditModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  businessId: string;
  currentData: {
    description?: string | null;
    website_url?: string | null;
  };
}

interface FieldEdit {
  fieldName: string;
  label: string;
  currentValue: string;
  newValue: string;
}

const SuggestEditModal: React.FC<SuggestEditModalProps> = ({
  open,
  onClose,
  courseId,
  businessId,
  currentData,
}) => {
  const { session } = useSupabaseSession();

  const fields: FieldEdit[] = [
    { fieldName: 'description', label: 'Description', currentValue: currentData.description || '', newValue: currentData.description || '' },
    { fieldName: 'website_url', label: 'Website', currentValue: currentData.website_url || '', newValue: currentData.website_url || '' },
  ];

  const [edits, setEdits] = useState<FieldEdit[]>(fields);

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!session?.user?.id) throw new Error('Not authenticated');
      const changedFields = edits.filter(f => f.newValue.trim() !== f.currentValue.trim() && f.newValue.trim());
      if (changedFields.length === 0) throw new Error('No changes made');
      const rows = changedFields.map(f => ({
        course_id: courseId,
        business_id: businessId,
        suggested_by: session.user.id,
        field_name: f.fieldName,
        current_value: f.currentValue || null,
        suggested_value: f.newValue.trim(),
      }));
      const { error } = await supabase.from('course_edit_suggestions').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Suggestion submitted', {
        description: "Your suggestion has been submitted. We'll review it shortly.",
      });
      onClose();
    },
    onError: (err: Error) => {
      if (err.message === 'No changes made') {
        toast('No changes', { description: 'Make at least one change to submit.' });
      } else {
        toast.error('Error', { description: 'Failed to submit suggestion. Please try again.' });
      }
    },
  });

  const updateField = (index: number, value: string) => {
    setEdits(prev => prev.map((f, i) => (i === index ? { ...f, newValue: value } : f)));
  };

  const hasChanges = edits.some(f => f.newValue.trim() !== f.currentValue.trim() && f.newValue.trim());

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Suggest an edit</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          {edits.map((field, i) => (
            <div key={field.fieldName}>
              <label className="text-sm font-medium text-foreground mb-1 block">{field.label}</label>
              {field.fieldName === 'description' ? (
                <textarea value={field.newValue} onChange={(e) => updateField(i, e.target.value)} className="w-full min-h-[100px] p-3 text-sm bg-card border border-border rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-border" maxLength={2500} />
              ) : (
                <input type="text" value={field.newValue} onChange={(e) => updateField(i, e.target.value)} className="w-full h-11 px-3 text-sm bg-card border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-border" />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => submitMutation.mutate()} disabled={!hasChanges || submitMutation.isPending}>
            {submitMutation.isPending ? 'Submitting…' : 'Submit suggestion for review'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SuggestEditModal;
