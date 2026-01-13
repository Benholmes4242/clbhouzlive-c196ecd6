import React, { useState } from 'react';
import { X, Search, UserPlus, Mail, Link2, Check } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useBulkInviteParticipants } from '@/features/events/hooks/useEventParticipants';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onClose: () => void;
  eventId: string;
  onSuccess?: () => void;
}

interface PendingInvite {
  name: string;
  email?: string;
  handicap?: number;
}

export function InvitePlayersSheet({ open, onClose, eventId, onSuccess }: Props) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestHandicap, setGuestHandicap] = useState('');
  const [pending, setPending] = useState<PendingInvite[]>([]);

  const { mutate: bulkInvite, isPending } = useBulkInviteParticipants();

  const handleAddGuest = () => {
    if (guestName.trim()) {
      setPending(prev => [...prev, {
        name: guestName.trim(),
        email: guestEmail.trim() || undefined,
        handicap: guestHandicap ? parseFloat(guestHandicap) : undefined,
      }]);
      setGuestName('');
      setGuestEmail('');
      setGuestHandicap('');
    }
  };

  const handleRemove = (index: number) => {
    setPending(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendInvites = () => {
    const participants = pending.map(p => ({
      guestName: p.name,
      guestEmail: p.email,
      handicapIndex: p.handicap,
    }));

    bulkInvite(
      { eventId, participants },
      {
        onSuccess: () => {
          setPending([]);
          onSuccess?.();
          onClose();
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle>Invite Players</SheetTitle>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </SheetHeader>

        <div className="py-6 space-y-6 overflow-y-auto max-h-[calc(85vh-180px)]">
          {/* Add Guest Form */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <UserPlus className="w-4 h-4" />
              Add Player
            </div>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Player name *"
              className="w-full p-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="email"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email (optional)"
                className="p-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
              />
              <input
                type="number"
                step="0.1"
                value={guestHandicap}
                onChange={(e) => setGuestHandicap(e.target.value)}
                placeholder="Handicap"
                className="p-3 bg-muted rounded-lg border-0 focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" onClick={handleAddGuest} disabled={!guestName.trim()} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              Add to List
            </Button>
          </div>

          {/* Pending Invites */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Ready to Invite ({pending.length})</p>
              <div className="space-y-2">
                {pending.map((p, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                      {p.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      {p.email && <p className="text-sm text-muted-foreground truncate">{p.email}</p>}
                    </div>
                    {p.handicap && <span className="text-sm text-muted-foreground">HCP {p.handicap}</span>}
                    <button onClick={() => handleRemove(index)} className="p-1 hover:bg-muted rounded">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        {pending.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
            <Button onClick={handleSendInvites} disabled={isPending} className="w-full h-12 rounded-xl">
              {isPending ? 'Sending...' : `Send ${pending.length} Invite${pending.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
