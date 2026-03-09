import { Instagram, Twitter, Youtube } from 'lucide-react';

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

const INPUT_CLS = 'flex-1 bg-muted border-0 rounded-r-xl px-3 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:bg-background transition-colors';
const PREFIX_CLS = 'flex items-center justify-center w-11 bg-muted rounded-l-xl text-muted-foreground shrink-0 self-stretch';

function SocialRow({
  icon, placeholder, value, onChange,
}: {
  icon: React.ReactNode;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-stretch">
      <div className={PREFIX_CLS}>{icon}</div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.replace('@', ''))}
        placeholder={placeholder}
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        className={INPUT_CLS}
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
      <label className="text-[13px] font-medium text-muted-foreground block mb-1">Social Links</label>
      <SocialRow icon={<Instagram size={16} />} placeholder="instagram username" value={instagram} onChange={onInstagramChange} />
      <SocialRow icon={<Twitter size={16} />} placeholder="twitter username" value={twitter} onChange={onTwitterChange} />
      <SocialRow icon={<TikTokIcon />} placeholder="tiktok username" value={tiktok} onChange={onTiktokChange} />
      <SocialRow icon={<Youtube size={16} />} placeholder="youtube channel" value={youtube} onChange={onYoutubeChange} />
    </div>
  );
}
