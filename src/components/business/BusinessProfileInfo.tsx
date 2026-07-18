import React from 'react';
import {
  Phone, Mail, Globe, MapPin, Clock, Check, ArrowUpRight,
} from 'lucide-react';
import { SiInstagram, SiX, SiFacebook, SiTiktok, SiYoutube } from 'react-icons/si';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
  canManage?: boolean;
  userId?: string | null;
}

const INK = '#0F172A';
const INK_45 = '#64748B';
const HAIR = 'rgba(15,23,42,0.08)';

/* ── Kicker section header ── */
function SectionKicker({ children }: { children: string }) {
  return (
    <SectionHeader
      role="section"
      kicker={children.toUpperCase()}
    />
  );
}

function SectionDivider() {
  return <div className="mx-6 h-px" style={{ background: HAIR }} />;
}

/* ── Facilities chips ── */
function FacilitiesSection({ amenities }: { amenities: string[] }) {
  return (
    <section className="px-4 py-4">
      <SectionKicker>Facilities</SectionKicker>
      <div className="flex flex-wrap gap-2">
        {amenities.map((a) => (
          <span
            key={a}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-medium"
            style={{
              background: '#ffffff',
              border: `1px solid ${HAIR}`,
              color: INK,
            }}
          >
            <Check className="w-3 h-3" style={{ color: INK_45 }} strokeWidth={2.5} />
            {a}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ── Contact row ── */
function ContactRow({
  icon: Icon, value, label, onClick, isLink = false,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  onClick?: () => void;
  isLink?: boolean;
}) {
  const Wrapper: any = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className="flex items-start gap-3 w-full text-left min-h-[52px] py-3 active:opacity-70 transition-opacity"
    >
      <Icon className="h-4 w-4 mt-1 shrink-0" style={{ color: INK_45 }} />
      <div className="min-w-0 flex-1">
        <p className="text-[14.5px] font-medium truncate" style={{ color: INK }}>
          {value}
          {isLink && <ArrowUpRight className="inline h-3 w-3 ml-0.5 opacity-70" style={{ color: INK_45 }} />}
        </p>
        <p className="text-[11.5px]" style={{ color: INK_45 }}>{label}</p>
      </div>
    </Wrapper>
  );
}

/* ── Opening hours helpers ── */
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const DAY_LABELS: Record<string, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

function isOpenNow(oh: Record<string, { open: string; close: string; closed: boolean }>): boolean {
  const now = new Date();
  const dayIdx = (now.getDay() + 6) % 7; // 0 = Mon
  const key = DAY_KEYS[dayIdx];
  const today = oh[key];
  if (!today || today.closed) return false;
  const [oh_h, oh_m] = (today.open || '').split(':').map(Number);
  const [cl_h, cl_m] = (today.close || '').split(':').map(Number);
  if ([oh_h, oh_m, cl_h, cl_m].some(n => Number.isNaN(n))) return false;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const openMin = oh_h * 60 + oh_m;
  const closeMin = cl_h * 60 + cl_m;
  return nowMin >= openMin && nowMin < closeMin;
}

function OpeningHoursSection({
  hours,
}: {
  hours: Record<string, { open: string; close: string; closed: boolean }>;
}) {
  const openNow = isOpenNow(hours);
  return (
    <section className="px-4 py-4">
      <SectionKicker>Opening hours</SectionKicker>
      {openNow && (
        <div
          className="inline-flex items-center gap-1.5 mb-3 px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
          style={{ background: 'rgba(5,150,105,0.10)', color: '#059669' }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ background: '#059669' }}
          />
          Open now
        </div>
      )}
      <div className="flex flex-col">
        {DAY_KEYS.map((k) => {
          const h = hours[k];
          if (!h) return null;
          return (
            <div
              key={k}
              className="flex items-center justify-between py-2"
              style={{ borderBottom: `1px solid ${HAIR}` }}
            >
              <span className="flex items-center gap-2 text-[13.5px]" style={{ color: INK }}>
                <Clock className="h-3.5 w-3.5" style={{ color: INK_45 }} />
                {DAY_LABELS[k]}
              </span>
              <span className="text-[13.5px]" style={{ color: h.closed ? INK_45 : INK }}>
                {h.closed ? 'Closed' : `${h.open} – ${h.close}`}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ── Socials ── */
const SOCIAL_CONFIG: {
  key: keyof NonNullable<BusinessProfile['social_links']>;
  Icon: React.ElementType;
  label: string;
  buildUrl: (value: string) => string;
}[] = [
  { key: 'instagram', Icon: SiInstagram, label: 'Instagram', buildUrl: (h) => `https://instagram.com/${h.replace(/^@/, '')}` },
  { key: 'twitter',   Icon: SiX,         label: 'X',         buildUrl: (h) => `https://x.com/${h.replace(/^@/, '')}` },
  { key: 'facebook',  Icon: SiFacebook,  label: 'Facebook',  buildUrl: ensureProtocol },
  { key: 'tiktok',    Icon: SiTiktok,    label: 'TikTok',    buildUrl: (h) => `https://tiktok.com/@${h.replace(/^@/, '')}` },
  { key: 'youtube',   Icon: SiYoutube,   label: 'YouTube',   buildUrl: ensureProtocol },
];

function ensureProtocol(url: string): string {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/* ── Main ── */
export function BusinessProfileInfo({ business, userId }: BusinessProfileInfoProps) {
  const amenities = Array.isArray(business.amenities) ? business.amenities.filter(Boolean) : [];
  const hasAmenities = amenities.length > 0;

  const contactHandlers = {
    website: () => {
      if (!business.website) return;
      trackBusinessAction(business.id, 'website', userId);
      openExternalUrl(ensureProtocol(business.website));
    },
    email: () => {
      if (!business.email) return;
      window.location.href = `mailto:${business.email}`;
    },
    phone: () => {
      if (!business.phone) return;
      trackBusinessAction(business.id, 'call', userId);
      window.location.href = `tel:${business.phone}`;
    },
  };
  const hasContact = !!(business.phone || business.email || business.website);

  // Opening hours: respect show_opening_hours AND must have >=1 non-empty day
  const oh = business.opening_hours || {};
  const ohHasContent = DAY_KEYS.some((k) => {
    const h = (oh as any)[k];
    return h && (h.closed === true || (h.open && h.close));
  });
  const showOpeningHours = business.show_opening_hours === true && ohHasContent;

  // Location
  const shortLocation =
    business.city && business.country
      ? `${business.city}, ${business.country}`
      : business.location || null;
  const handleDirections = () => {
    if (business.location || (business.lat && business.lng)) {
      trackBusinessAction(business.id, 'directions', userId);
      const q = business.location
        ? encodeURIComponent(business.location)
        : `${business.lat},${business.lng}`;
      openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${q}`, 'external');
    }
  };

  // Socials
  const socialLinks = (business.social_links || {}) as Record<string, string | undefined>;
  const socials = SOCIAL_CONFIG.filter(s => socialLinks[s.key] && socialLinks[s.key]!.trim().length > 0);
  const hasSocials = socials.length > 0;

  return (
    <div className="-mx-4 px-0 pb-24 bg-background">
      {hasAmenities && (
        <>
          <FacilitiesSection amenities={amenities} />
          <SectionDivider />
        </>
      )}

      {hasContact && (
        <>
          <section className="px-4 py-4">
            <SectionKicker>Contact</SectionKicker>
            <div className="flex flex-col [&>*+*]:border-t" style={{ ['--tw-border-opacity' as any]: 1 }}>
              {business.website && (
                <ContactRow
                  icon={Globe}
                  value={business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  label="Website"
                  onClick={contactHandlers.website}
                  isLink
                />
              )}
              {business.phone && (
                <ContactRow icon={Phone} value={business.phone} label="Phone" onClick={contactHandlers.phone} />
              )}
              {business.email && (
                <ContactRow icon={Mail} value={business.email} label="Email" onClick={contactHandlers.email} isLink />
              )}
            </div>
          </section>
          <SectionDivider />
        </>
      )}

      {showOpeningHours && (
        <>
          <OpeningHoursSection hours={oh as Record<string, { open: string; close: string; closed: boolean }>} />
          <SectionDivider />
        </>
      )}

      {shortLocation && (
        <>
          <section className="px-4 py-4">
            <SectionKicker>Location</SectionKicker>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: INK_45 }} />
              <div>
                <p className="text-[14.5px] font-medium" style={{ color: INK }}>{shortLocation}</p>
                <button
                  type="button"
                  onClick={handleDirections}
                  className="text-[13px] font-semibold mt-2 min-h-[44px] flex items-center gap-0.5 active:scale-[0.97] transition-transform"
                  style={{ color: INK }}
                >
                  Get directions
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" style={{ color: INK_45 }} />
                </button>
              </div>
            </div>
          </section>
          {hasSocials && <SectionDivider />}
        </>
      )}

      {hasSocials && (
        <section className="px-4 py-4">
          <SectionKicker>Follow us</SectionKicker>
          <div className="flex items-center gap-2 flex-wrap">
            {socials.map(({ key, Icon, label, buildUrl }) => {
              const url = buildUrl(socialLinks[key]!.trim());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openExternalUrl(url)}
                  aria-label={label}
                  className="h-10 w-10 inline-flex items-center justify-center rounded-full active:scale-[0.97] transition-transform"
                  style={{ background: '#ffffff', border: `1px solid ${HAIR}`, color: INK }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
