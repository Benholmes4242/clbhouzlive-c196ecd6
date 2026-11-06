/** ONLY YOU SEE THIS — the pro's own 30-day reach card, amber because only
 * he ever sees it. Owner-only, one settled read, failures render nothing.
 * The white button opens the sponsor sheet. */
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useProReach } from './useProClubhouse';
import { trackingFromLine } from './proClubhouseRules';
import { ProSponsorSheet, type SponsorIdentity, type SponsorSeason } from './ProSponsorSheet';

export function ProOnlyYouSection({ userId, owner, identity, season, followers }: {
  userId: string;
  owner: boolean;
  identity: SponsorIdentity;
  season: SponsorSeason | null;
  followers: number | null;
}) {
  const query = useProReach(owner);
  const [sheetOpen, setSheetOpen] = useState(false);
  if (!owner) return null;
  if (!query.isSuccess || query.isError) return null;
  const data = query.data;
  const trackingLine = trackingFromLine(data.tracking_since);
  return (
    <section data-pro-reach className="pro-profile-section">
      <div className="pro-profile-heading"><h2 className="pro-only-you">ONLY YOU SEE THIS</h2></div>
      <div className="pro-profile-card pro-kit">
        <div className="pro-kit-title">Your profile, last 30 days</div>
        <div className="pro-kit-tiles">
          <div><b>{data.views_30.toLocaleString('en-GB')}</b><span>VIEWS</span></div>
          <div><b className={data.new_followers_30 > 0 ? 'pro-kit-gain' : undefined}>{data.new_followers_30 > 0 ? `+${data.new_followers_30.toLocaleString('en-GB')}` : '0'}</b><span>FOLLOWERS</span></div>
          <div><b>{data.questions_30.toLocaleString('en-GB')}</b><span>QUESTIONS</span></div>
        </div>
        {trackingLine && <div className="pro-kit-tracking">{trackingLine}</div>}
        <p>A one-page summary of your season, results and reach on clbhouz, ready to send to a sponsor.</p>
        <Button variant={null} size={null} className="pro-profile-command" onClick={() => setSheetOpen(true)}>Make my sponsor sheet</Button>
      </div>
      <ProSponsorSheet open={sheetOpen} onClose={() => setSheetOpen(false)} proId={userId} identity={identity} season={season} followers={followers} />
    </section>
  );
}
