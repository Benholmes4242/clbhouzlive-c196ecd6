import { toast } from 'sonner';

export async function shareInvite(invite: {
  share_url: string;
  share_message: string;
  invitee_name: string;
}): Promise<void> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Invite ${invite.invitee_name} to Clbhouz`,
        text: invite.share_message,
        url: invite.share_url,
      });
      toast.success(`Shared invite to ${firstName(invite.invitee_name)}`);
      return;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      // fall through to clipboard
    }
  }
  try {
    await navigator.clipboard.writeText(invite.share_message);
    toast.success('Invite copied — paste it anywhere');
  } catch {
    toast.error("Couldn't share invite");
  }
}

export function firstName(fullName: string): string {
  // EG names typically come as "Surname, Given" — take given part
  const trimmed = fullName.trim();
  if (trimmed.includes(',')) {
    const given = trimmed.split(',').pop()?.trim() ?? trimmed;
    return given.split(/\s+/)[0] ?? given;
  }
  return trimmed.split(/\s+/)[0] ?? trimmed;
}
