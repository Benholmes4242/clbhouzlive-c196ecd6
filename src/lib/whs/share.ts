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

/**
 * Open a consolidated share sheet for multiple invites at once.
 * Each invitee gets their own share URL but they're concatenated
 * into a single share message so the user only triggers one share
 * dialogue. Returns false if neither share nor clipboard succeed.
 */
export async function shareInvitesBulk(
  invites: Array<{
    share_url: string;
    share_message: string;
    invitee_name: string;
  }>,
): Promise<boolean> {
  if (invites.length === 0) return false;
  if (invites.length === 1) {
    await shareInvite(invites[0]);
    return true;
  }
  const names = invites.map((i) => firstName(i.invitee_name));
  const namesJoined =
    names.length === 2
      ? names.join(' and ')
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
  const links = invites
    .map((i) => `${firstName(i.invitee_name)}: ${i.share_url}`)
    .join('\n');
  const combinedMessage = `Join me on Clbhouz, ${namesJoined} — your invite links below:\n\n${links}`;
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title: `Invite ${invites.length} friends to Clbhouz`,
        text: combinedMessage,
      });
      toast.success(`Shared ${invites.length} invites`);
      return true;
    } catch (err) {
      if ((err as Error).name === 'AbortError') return true;
    }
  }
  try {
    await navigator.clipboard.writeText(combinedMessage);
    toast.success(`${invites.length} invites copied — paste them anywhere`);
    return true;
  } catch {
    toast.error("Couldn't share invites");
    return false;
  }
}
