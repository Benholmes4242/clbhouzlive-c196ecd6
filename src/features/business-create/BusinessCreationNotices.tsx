/** Editor and create flow share persistent recovery and discard copy/lifecycle. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export interface OwnerlessNotice { name: string; id: string; target: string }
export function BusinessOwnerlessNotice({ notice, onDismiss }: { notice: OwnerlessNotice | null; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  return <AlertDialog open={!!notice} onOpenChange={() => { /* dismiss only via the button */ }}>
    <AlertDialogContent onEscapeKeyDown={e => e.preventDefault()}>
      <AlertDialogHeader><AlertDialogTitle>You are not yet listed as the owner</AlertDialogTitle>
        <AlertDialogDescription>"{notice?.name}" was created, but you are not yet listed as its owner. Contact support to fix it and quote this business id.</AlertDialogDescription>
      </AlertDialogHeader>
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2">
        <code className="flex-1 break-all text-[13px] tabular-nums text-foreground">{notice?.id}</code>
        <Button variant="ghost" className="text-[13px] font-semibold text-primary" onClick={async () => {
          if (!notice) return;
          try { await navigator.clipboard.writeText(notice.id); setCopied(true); } catch { setCopied(false); }
        }}>{copied ? 'Copied' : 'Copy id'}</Button>
      </div>
      <AlertDialogFooter><AlertDialogAction onClick={onDismiss}>I've noted it</AlertDialogAction></AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>;
}
export function BusinessDiscardNotice({ open, onOpenChange, onDiscard }: { open: boolean; onOpenChange: (open: boolean) => void; onDiscard: () => void }) {
  return <AlertDialog open={open} onOpenChange={onOpenChange}><AlertDialogContent>
    <AlertDialogHeader><AlertDialogTitle>Discard changes?</AlertDialogTitle><AlertDialogDescription>You have unsaved changes. They will be lost if you leave now.</AlertDialogDescription></AlertDialogHeader>
    <AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={onDiscard}>Discard</AlertDialogAction></AlertDialogFooter>
  </AlertDialogContent></AlertDialog>;
}