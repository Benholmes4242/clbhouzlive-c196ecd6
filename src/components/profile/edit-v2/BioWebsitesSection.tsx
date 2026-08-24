import type React from 'react';
import { Plus, X } from 'lucide-react';
import { WebsiteEntry, BIO_MAX } from '@/components/profile/profile-wizard/types';
import { Label } from '@/components/manage/ui';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';
import { A } from '@/features/courses/components/holes/analytical/tokens';

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
        <Label
          right={
            <span className={`text-[11px] ${bio.length > BIO_MAX * 0.9 ? 'text-destructive' : 'text-muted-foreground/60'}`}>
              {bio.length}/{BIO_MAX}
            </span>
          }
        >
          Bio
        </Label>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          maxLength={BIO_MAX}
          rows={4}
          placeholder="Tell the clbhouz community about yourself and your golf game…"
          className={`scrollbar-hide ${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} w-full px-3.5 py-2.5 text-[15px] leading-relaxed text-[rgba(255,255,255,0.96)] focus:outline-none resize-none`}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}
        />
        {bioError && <p className="text-[12px] text-destructive mt-1">{bioError}</p>}
      </div>

      <div>
        <Label>Websites</Label>
        <div className="space-y-2">
          {websites.map((site) => (
            <div key={site.id} className="flex items-center gap-2">
              <input
                type="url"
                inputMode="url"
                value={site.url}
                onChange={(e) => onUpdateWebsite(site.id, e.target.value)}
                placeholder="https://yoursite.com"
                className={`${FIELD_PAINT_CLASS} ${FIELD_PLACEHOLDER_CLASS} flex-1 px-3.5 py-2.5 text-[15px] text-[rgba(255,255,255,0.96)] focus:outline-none`}
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
              className="flex items-center gap-2.5 text-[14px] font-semibold min-h-[44px]"
              style={{ color: A.INK }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <Plus size={14} style={{ color: A.MUTE }} />
              </div>
              Add website
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
