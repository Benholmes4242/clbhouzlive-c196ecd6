import { Instagram, Youtube } from 'lucide-react';

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
    <div className="flex overflow-hidden rounded-[10px] border border-border/60">
      <div className="w-11 flex-shrink-0 flex items-center justify-center bg-[#F0F4F3] text-muted-foreground border-r border-border/60">
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
        className="flex-1 bg-[#F8FAFC] px-3 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[hsl(38,92%,50%)]/40 transition-colors"
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <div style={{ width: 3, height: 10, background: '#F7931E', borderRadius: 1, flexShrink: 0 }} />
        <span style={{ fontSize: 9, fontWeight: 900, color: '#F7931E', letterSpacing: '0.16em', textTransform: 'uppercase' as const }}>
          Social Links
        </span>
      </div>
      <SocialRow icon={<Instagram size={16} />} placeholder="instagram username" value={instagram} onChange={onInstagramChange} />
      <SocialRow icon={<XIcon />} placeholder="x username" value={twitter} onChange={onTwitterChange} />
      <SocialRow icon={<TikTokIcon />} placeholder="tiktok username" value={tiktok} onChange={onTiktokChange} />
      <SocialRow icon={<Youtube size={16} />} placeholder="youtube channel" value={youtube} onChange={onYoutubeChange} />
    </div>
  );
}
