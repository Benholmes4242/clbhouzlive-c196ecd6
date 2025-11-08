/**
 * Game Expanded Meta
 * Shows creation/expiration metadata
 */

type GameExpandedMetaProps = {
  expiresAt: string;
};

export function GameExpandedMeta({ expiresAt }: GameExpandedMetaProps) {
  const expiresDate = new Date(expiresAt);
  const now = new Date();
  const hoursUntilExpiry = Math.round((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  
  let expiresPretty: string;
  if (hoursUntilExpiry < 1) {
    expiresPretty = 'soon';
  } else if (hoursUntilExpiry < 24) {
    expiresPretty = `in ${hoursUntilExpiry}h`;
  } else {
    const days = Math.floor(hoursUntilExpiry / 24);
    expiresPretty = `in ${days}d`;
  }

  return (
    <div 
      className="mt-2.5 flex items-center gap-3 text-[12px]"
      style={{ color: 'var(--hub-text-sub)', opacity: 0.6 }}
    >
      <span>Expires {expiresPretty}</span>
    </div>
  );
}
