import React, { useState } from 'react';
import { Phone, Mail, Globe, MapPin, Building2, Calendar, Pencil, ArrowUpRight } from 'lucide-react';
import { BusinessProfile } from '@/hooks/useBusinessProfile';
import { format } from 'date-fns';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useNavigate } from 'react-router-dom';

interface BusinessProfileInfoProps {
  business: BusinessProfile;
  canManage?: boolean;
}

/* ── Bio with Show more / Show less ── */
const BIO_CHAR_LIMIT = 200;

function BioSection({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const shouldTruncate = text.length > BIO_CHAR_LIMIT;
  const displayText = !expanded && shouldTruncate ? text.slice(0, BIO_CHAR_LIMIT).trimEnd() + '…' : text;

  return (
    <section className="px-6 pb-8">
      <p
        className="text-base leading-relaxed text-foreground whitespace-pre-wrap"
        style={{ overflowWrap: 'anywhere' }}
      >
        {displayText}
      </p>

      {shouldTruncate && (
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-[0.8125rem] font-medium text-muted-foreground mt-1 active:scale-95 transition-transform"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </section>
  );
}

/* ── Thin section divider ── */
function SectionDivider() {
  return <div className="mx-6 h-px bg-border/40" />;
}

/* ── Section eyebrow heading ── */
function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[11px] font-semibold uppercase tracking-[1.5px] text-muted-foreground mb-3">
      {children}
    </h2>
  );
}

/* ── Contact row ── */
function ContactRow({
  icon: Icon,
  value,
  label,
  onClick,
  isLink = false,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  onClick?: () => void;
  isLink?: boolean;
}) {
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className="flex items-start gap-3 w-full text-left min-h-[44px] py-1.5 active:opacity-70 transition-opacity"
    >
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${isLink ? 'text-amber-500' : 'text-foreground'}`}>
          {value}
          {isLink && <ArrowUpRight className="inline h-3 w-3 ml-0.5 opacity-70" />}
        </p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </Wrapper>
  );
}

/* ── Detail row (Business Details section) ── */
function DetailRow({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ElementType;
  value: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-sm font-medium text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

/* ── Main component ── */
export function BusinessProfileInfo({ business, canManage }: BusinessProfileInfoProps) {
  const navigate = useNavigate();

  const handleCall = () => {
    if (business.phone) window.location.href = `tel:${business.phone}`;
  };

  const handleEmail = () => {
    if (business.email) window.location.href = `mailto:${business.email}`;
  };

  const handleWebsite = () => {
    if (business.website) {
      const url = business.website.startsWith('http')
        ? business.website
        : `https://${business.website}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDirections = () => {
    if (business.location) {
      const query = encodeURIComponent(business.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleEdit = () => navigate(`/business/${business.id}/edit`);

  // Shorten location: prefer "City, Country" or fall back to full location
  const shortLocation =
    business.city && business.country
      ? `${business.city}, ${business.country}`
      : business.location || null;

  const hasContact = business.phone || business.email || business.website;
  const showCategory = business.category && business.category !== 'Other';

  return (
    <div className="-mx-5 px-0 pb-20 bg-background">
      {/* Bio */}
      {business.description && (
        <BioSection text={business.description} />
      )}

      {/* Contact */}
      {hasContact && (
        <>
          <SectionDivider />
          <section className="px-6 py-5">
            <SectionHeading>Contact</SectionHeading>
            <div className="flex flex-col divide-y divide-border/30">
              {business.phone && (
                <ContactRow icon={Phone} value={business.phone} label="Phone" onClick={handleCall} />
              )}
              {business.email && (
                <ContactRow icon={Mail} value={business.email} label="Email" onClick={handleEmail} isLink />
              )}
              {business.website && (
                <ContactRow
                  icon={Globe}
                  value={business.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  label="Website"
                  onClick={handleWebsite}
                  isLink
                />
              )}
            </div>
          </section>
        </>
      )}

      {/* Location */}
      {shortLocation && (
        <>
          <SectionDivider />
          <section className="px-6 py-5">
            <SectionHeading>Location</SectionHeading>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-foreground">{shortLocation}</p>
                <button
                  type="button"
                  onClick={handleDirections}
                  className="text-[0.8125rem] font-semibold text-amber-500 mt-1 min-h-[44px] flex items-center gap-0.5 active:scale-95 transition-transform"
                >
                  Get directions
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-70" />
                </button>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Business Details */}
      {(showCategory || business.is_verified || business.created_at) && (
        <>
          <SectionDivider />
          <section className="px-6 py-5">
            <SectionHeading>Business Details</SectionHeading>
            <div className="flex flex-col gap-1">
              {showCategory && (
                <DetailRow icon={Building2} value={business.category!} label="Category" />
              )}
              {business.is_verified && (
                <div className="flex items-start gap-3 py-1.5">
                  <div className="mt-0.5 shrink-0">
                    <VerifiedBadge size="sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Verified Business</p>
                    <p className="text-xs text-muted-foreground">Verified by clbhouz</p>
                  </div>
                </div>
              )}
              {business.created_at && (
                <DetailRow
                  icon={Calendar}
                  value={format(new Date(business.created_at), 'MMMM yyyy')}
                  label="Member since"
                />
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
