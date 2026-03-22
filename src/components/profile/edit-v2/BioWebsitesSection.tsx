import { Plus, X } from 'lucide-react';
import { WebsiteEntry, BIO_MAX } from '@/components/profile/profile-wizard/types';

interface Props {
  bio: string;
  websites: WebsiteEntry[];
  bioError?: string;
  websitesError?: string;
  onBioChange: (v: string) => void;
  onAddWebsite: () => void;
  onRemoveWebsite: (id: string) => void;
  onUpdateWebsite: (id: string, url: string) => void;
}

export function BioWebsitesSection({
  bio, websites, bioError, websitesError,
  onBioChange, onAddWebsite, onRemoveWebsite, onUpdateWebsite,
}: Props) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label className="text-[13px] font-medium text-muted-foreground">Bio</label>
          <span className={`text-[11px] ${bio.length > BIO_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground'}`}>
            {bio.length}/{BIO_MAX}
          </span>
        </div>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          maxLength={BIO_MAX}
          rows={4}
          placeholder="Tell the clbhouz community about yourself and your golf game…"
          className="w-full bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors resize-none"
        />
        {bioError && <p className="text-[12px] text-destructive mt-1">{bioError}</p>}
      </div>

      <div>
        <label className="text-[13px] font-medium text-muted-foreground mb-2 block">Websites</label>
        <div className="space-y-2">
          {websites.map((site) => (
            <div key={site.id} className="flex items-center gap-2">
              <input
                type="url"
                inputMode="url"
                value={site.url}
                onChange={(e) => onUpdateWebsite(site.id, e.target.value)}
                placeholder="https://yoursite.com"
                className="flex-1 bg-muted border-0 rounded-xl px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 focus:bg-background transition-colors"
              />
              <button
                onClick={() => onRemoveWebsite(site.id)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          ))}
          {websitesError && (
            <p className="text-[12px] text-destructive">{websitesError}</p>
          )}
          {websites.length < 3 && (
            <button
              onClick={onAddWebsite}
              className="flex items-center gap-2 text-[hsl(36,77%,49%)] text-[14px] font-medium min-h-[44px]"
            >
              <Plus size={16} />
              Add website
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
