import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowUpRight, Flag } from 'lucide-react';
import { SiInstagram, SiX, SiFacebook, SiTiktok, SiYoutube } from 'react-icons/si';
import { useTranslation } from 'react-i18next';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { A, Panel, Action, LABEL } from '@/features/courses/components/holes/analytical/tokens';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { useNearestCourse } from '@/hooks/useNearestCourse';
import { formatDistanceKm } from '@/utils/formatDistance';

const HOSPITALITY_CATEGORIES = new Set<string>([
  'Hotel / Accommodation',
  'Restaurant / Cafe',
  'Bar / Pub',
  'Resort',
]);

interface BusinessProfileInfoProps {
  business: BusinessProfile;
  canManage?: boolean;
  userId?: string | null;
}

const VALUE: React.CSSProperties = {
  fontSize: 13.5,
  fontWeight: 700,
  color: A.INK,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

/**
 * Label-above-value row. No glyph: the label IS the identification, and no
 * hairline: separation inside a panel is whitespace only.
 */
function ContactRow({
  value, label, onClick, isLink = false,
}: {
  value: string;
  label: string;
  onClick?: () => void;
  isLink?: boolean;
}) {
  const Wrapper: React.ElementType = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button', onClick } : {})}
      className="w-full text-left active:opacity-70 transition-opacity"
      style={{ minHeight: 44, display: 'block', padding: 0 }}
    >
      <p style={LABEL}>{label}</p>
      <p style={{ ...VALUE, marginTop: 3 }}>
        {value}
        {isLink && <ArrowUpRight className="inline h-3 w-3 ml-0.5" style={{ color: A.DIM }} />}
      </p>
    </Wrapper>
  );
}

/* Opening hours helpers */
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
    <Panel
      kicker="OPENING HOURS"
      aside={openNow ? 'OPEN NOW' : undefined}
      style={{ marginTop: 12 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
        {DAY_KEYS.map((k) => {
          const h = hours[k];
          if (!h) return null;
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
              <span style={{ ...LABEL, color: A.MUTE }}>{DAY_LABELS[k]}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: h.closed ? A.DIM : A.INK }}>
                {h.closed ? 'Closed' : `${h.open} - ${h.close}`}
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* Socials - the brand marks ARE the identification, so they stay. */
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

/* Main */
export function BusinessProfileInfo({ business, userId }: BusinessProfileInfoProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const amenities = Array.isArray(business.amenities) ? business.amenities.filter(Boolean) : [];
  const hasAmenities = amenities.length > 0;

  // Reverse link: hospitality businesses near a course get a "Near {course}" row.
  const isHospitality = !!business.category && HOSPITALITY_CATEGORIES.has(business.category);
  const hasCoords =
    business.lat != null && business.lng != null &&
    Number.isFinite(business.lat) && Number.isFinite(business.lng);
  const { data: nearestCourse } = useNearestCourse(
    isHospitality && hasCoords ? business.lat : null,
    isHospitality && hasCoords ? business.lng : null,
  );

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
  const ohTyped = oh as Record<string, { open?: string; close?: string; closed?: boolean } | undefined>;
  const ohHasContent = DAY_KEYS.some((k) => {
    const h = ohTyped[k];
    return !!h && (h.closed === true || (!!h.open && !!h.close));
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
    <div className="pb-24">
      {hasAmenities && (
        <Panel kicker="FACILITIES">
          <div className="flex flex-wrap gap-2">
            {amenities.map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] font-semibold"
                style={{ background: A.PANEL, border: `1px solid ${A.BORDER}`, color: A.INK }}
              >
                <Check className="w-3 h-3" style={{ color: A.DIM }} strokeWidth={2.5} />
                {a}
              </span>
            ))}
          </div>
        </Panel>
      )}

      {hasContact && (
        <Panel kicker={t('business.about.contact')} style={{ marginTop: hasAmenities ? 12 : 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 12 }}>
            {business.website && (
              <ContactRow
                value={business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                label="Website"
                onClick={contactHandlers.website}
                isLink
              />
            )}
            {business.phone && (
              <ContactRow value={business.phone} label="Phone" onClick={contactHandlers.phone} />
            )}
            {business.email && (
              <ContactRow value={business.email} label="Email" onClick={contactHandlers.email} isLink />
            )}
          </div>
        </Panel>
      )}

      {showOpeningHours && (
        <OpeningHoursSection hours={oh as Record<string, { open: string; close: string; closed: boolean }>} />
      )}

      {shortLocation && (
        <Panel
          kicker={t('business.about.location')}
          style={{ marginTop: hasAmenities || hasContact || showOpeningHours ? 12 : 0 }}
        >
          <p style={VALUE}>{shortLocation}</p>
          <Action
            label={t('business.about.directions')}
            align="left"
            onClick={handleDirections}
            style={{ marginTop: 10 }}
          />
          {isHospitality && hasCoords && nearestCourse && (
            <button
              type="button"
              onClick={() => navigate(`/courses/${nearestCourse.id}`)}
              className="mt-1 flex items-center gap-2 active:opacity-70 transition-opacity"
              style={{ minHeight: 40, background: 'transparent', border: 'none', padding: 0 }}
            >
              <Flag className="h-3.5 w-3.5 shrink-0" style={{ color: A.DIM }} strokeWidth={2} />
              <span style={{ fontSize: 13, color: A.INK, fontWeight: 700 }}>
                {`Near ${nearestCourse.name}`}
                <span style={{ color: A.DIM, fontWeight: 600 }}>{` . ${formatDistanceKm(nearestCourse.distance_km)}`}</span>
              </span>
            </button>
          )}
        </Panel>
      )}

      {hasSocials && (
        <Panel kicker={t('business.about.follow')} style={{ marginTop: 12 }}>
          <div className="flex items-center gap-2 flex-wrap">
            {socials.map(({ key, Icon, label, buildUrl }) => {
              const url = buildUrl(socialLinks[key]!.trim());
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => openExternalUrl(url)}
                  aria-label={label}
                  className="h-10 w-10 inline-flex items-center justify-center active:opacity-70 transition-opacity"
                  style={{
                    background: A.PANEL,
                    border: `1px solid ${A.BORDER}`,
                    borderRadius: '34%',
                    color: A.INK,
                  }}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </Panel>
      )}
    </div>
  );
}
