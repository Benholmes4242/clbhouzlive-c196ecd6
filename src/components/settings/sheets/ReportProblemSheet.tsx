import { useState } from 'react';
import { X } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const CATEGORIES = ['Bug / Crash', 'Performance', 'Content Issue', 'Account Problem', 'Other'];

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string | undefined;
}

export function ReportProblemSheet({ open, onClose, userId }: Props) {
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!category || !description.trim()) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('support_tickets').insert({
        user_id: userId,
        category,
        description: description.trim(),
        status: 'open',
      });
      if (error) throw error;
      toast.success('Report submitted', { description: 'Our team will review your report shortly.' });
      setCategory('');
      setDescription('');
      onClose();
    } catch {
      toast.error('Could not submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-[20px] bg-background border-0 px-5"
        hideCloseButton
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mt-3 mb-4" />
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Report a Problem</h2>
          <button onClick={onClose} className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-2 rounded-full text-[13px] font-medium border min-h-[36px] transition-colors ${
                    category === cat
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-muted-foreground uppercase tracking-wide">Description</Label>
            <Textarea
              placeholder="Describe the problem in as much detail as possible…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </div>

        <Button
          className="w-full mt-6 min-h-[44px]"
          disabled={!category || !description.trim() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? 'Submitting…' : 'Submit Report'}
        </Button>
      </SheetContent>
    </Sheet>
  );
}
