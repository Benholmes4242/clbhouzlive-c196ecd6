import { Label } from '@/components/manage/ui';
import { Instagram, Youtube } from 'lucide-react';
import { FIELD_PAINT_CLASS, FIELD_PLACEHOLDER_CLASS } from '@/lib/tokens/field';


function XIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.95a8.16 8.16 0 0 0 4.77 1.52V7.03a4.85 4.85 0 0 1-1-.34z"/>
    </svg>
  );
}

interface Props {
  instagram: string;
  twitter: string;
  tiktok: string;
  youtube: string;
  onInstagramChange: (v: string) => void;
  onTwitterChange: (v: string) => void;
  onTiktokChange: (v: string) => void;
  onYoutubeChange: (v: string) => void;
}

function SocialRow({
  icon, placeholder, value, onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    /* FIELD CANON: the wrapper is the field (icon well + input), so the wrapper
       carries the paint and :focus-within steps it. */
    <div className={`${FIELD_PAINT_CLASS} flex overflow-hidden`}>
      <div className="w-11 flex-shrink-0 flex items-center justify-center text-[rgba(255,255,255,0.62)] border-r border-[rgba(255,255,255,0.10)]">
        {icon}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace('@', ''))}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={`${FIELD_PLACEHOLDER_CLASS} flex-1 bg-transparent px-3 py-2.5 text-[15px] text-[rgba(255,255,255,0.96)] focus:outline-none`}
      />
    </div>
  );
}

export function SocialLinksSection({
  instagram, twitter, tiktok, youtube,
  onInstagramChange, onTwitterChange, onTiktokChange, onYoutubeChange,
}: Props) {
  return (
    <div className="space-y-2">
      <Label>Social links</Label>

      <SocialRow icon={<Instagram size={16} />} placeholder="instagram username" value={instagram} onChange={onInstagramChange} />
      <SocialRow icon={<XIcon />} placeholder="x username" value={twitter} onChange={onTwitterChange} />
      <SocialRow icon={<TikTokIcon />} placeholder="tiktok username" value={tiktok} onChange={onTiktokChange} />
      <SocialRow icon={<Youtube size={16} />} placeholder="youtube channel" value={youtube} onChange={onYoutubeChange} />
    </div>
  );
}
