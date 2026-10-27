/** CB107: club-only stored contact data. Shared hours/social definitions preserve About;
 * booking is always toast-only, including when a real booking URL is stored.
 * The signed-off week offset (-2px) and en-dash time separator are local exceptions.
 * CB107.2: an address is the Directions TITLE only at address/poi/postcode
 * precision; any coarser precision (city/region/country/pin/null) shows the
 * hero's place value (shared clubPlace) as the sub instead.
 * CB108: the club Team tab becomes a "Meet the team" row (last row, before the
 * facilities chips) shown only when the page's public team count is > 0; it opens
 * the existing BusinessTeamTab in a bottom sheet.
 */
import { useState, type ReactNode } from 'react';
import { BusinessTeamTab } from '@/components/business/BusinessTeamTab';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { ArrowUpRight, CalendarDays, Users, ChevronDown, ChevronUp, ChevronRight, Clock, Globe, Mail, MapPin, Phone, type LucideIcon } from 'lucide-react';
import type { BusinessProfile } from '@/hooks/useBusinessProfile';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { trackBusinessAction } from '@/lib/businessAnalyticsTracking';
import { openExternalUrl } from '@/utils/median/openExternalUrl';
import { SOCIAL_CONFIG, ensureProtocol } from '@/lib/business/socialLinks';
import { displaysOpeningHours, OPENING_HOURS_DAY_KEYS, OPENING_HOURS_DAY_LABELS, formatOpeningHours } from '@/lib/business/openingHours';
import { clubPlace } from '@/components/business/hero/ClubProfileHero';

function VisitingRow({ id, Icon, title, sub, marker, onClick, expanded }: {
  id: string; Icon: LucideIcon; title: string; sub?: string; marker: ReactNode; onClick: () => void; expanded?: boolean;
}) {
  return <Button type="button" variant="ghost" className={`club-visiting-row${id === 'book' ? ' club-visiting-soon' : ''}`} data-visiting-row={id} onClick={onClick} aria-expanded={expanded} aria-controls={expanded === undefined ? undefined : 'club-visiting-week'}>
    <span className="club-visiting-icon"><Icon size={16} strokeWidth={1.9} /></span>
    <span className="club-visiting-text"><b>{title}</b>{sub && <i>{sub}</i>}</span>
    <span className="club-visiting-marker">{marker}</span>
  </Button>;
}

export function ClubVisiting({ business, viewerId, firstCourseRegion, publicTeamCount = 0 }: {
  business: BusinessProfile; viewerId?: string | null; firstCourseRegion?: string | null; publicTeamCount?: number;
}) {
  const [weekOpen, setWeekOpen] = useState(false);
  const [teamOpen, setTeamOpen] = useState(false);
  const todayKey = OPENING_HOURS_DAY_KEYS[(new Date().getDay() + 6) % 7];
  const hours = business.opening_hours ?? {};
  const today = hours[todayKey];
  const hoursTitle = !today ? 'Opening hours' : today.closed ? 'Closed today' : `Open today · ${formatOpeningHours(today, '–')}`;
  const address = business.address_label || [business.address_line1, business.city, business.postcode].filter(Boolean).join(', ');
  const place = clubPlace({ city: business.city, region: business.region, country: business.country, firstCourseRegion });
  const addressIsTitle = business.location_precision === 'address' || business.location_precision === 'poi' || business.location_precision === 'postcode';
  const hasDirections = !!business.location || (business.lat != null && business.lng != null);
  const socials = SOCIAL_CONFIG.filter(({ key }) => !!business.social_links?.[key]?.trim());
  const handleDirections = () => {
    if (!hasDirections) return;
    trackBusinessAction(business.id, 'directions', viewerId);
    const q = business.location ? encodeURIComponent(business.location) : `${business.lat},${business.lng}`;
    openExternalUrl(`https://www.google.com/maps/search/?api=1&query=${q}`, 'external');
  };
  return <section className="club-visiting-card" data-club-visiting aria-label="Visiting">
    <div className="club-visiting-kicker">Visiting</div>
    <VisitingRow id="book" Icon={CalendarDays} title="Book a tee time" sub="Coming soon to clbhouz" marker={<span className="club-visiting-tag">Soon</span>} onClick={() => toast('Tee-time booking is coming soon.')} />
    {hasDirections && <VisitingRow id="directions" Icon={MapPin} title={addressIsTitle && address ? address : 'Directions'} sub={addressIsTitle && address ? 'Directions' : place} marker={<ArrowUpRight size={15} />} onClick={handleDirections} />}
    {business.website && <VisitingRow id="website" Icon={Globe} title="Website" sub={business.website.replace(/^https?:\/\//i, '').replace(/\/$/, '')} marker={<ArrowUpRight size={15} />} onClick={() => {
      if (!business.website) return;
      trackBusinessAction(business.id, 'website', viewerId);
      openExternalUrl(ensureProtocol(business.website));
    }} />}
    {business.phone && <VisitingRow id="phone" Icon={Phone} title="Call the club" sub={business.phone} marker={<ChevronRight size={15} />} onClick={() => {
      if (!business.phone) return;
      trackBusinessAction(business.id, 'call', viewerId);
      window.location.href = `tel:${business.phone}`;
    }} />}
    {business.email && <VisitingRow id="email" Icon={Mail} title="Email the club" sub={business.email} marker={<ChevronRight size={15} />} onClick={() => { if (business.email) window.location.href = `mailto:${business.email}`; }} />}
    {displaysOpeningHours(business) && <>
      <VisitingRow id="hours" Icon={Clock} title={hoursTitle} sub={today ? 'Opening hours' : undefined} expanded={weekOpen} marker={weekOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />} onClick={() => setWeekOpen((v) => !v)} />
      {weekOpen && <div className="club-visiting-week" id="club-visiting-week">
        {OPENING_HOURS_DAY_KEYS.map((key) => <div key={key} data-day={key} className={key === todayKey ? 'today' : undefined}>
          <span>{OPENING_HOURS_DAY_LABELS[key]}</span><span>{hours[key] ? formatOpeningHours(hours[key], '–') : ''}</span>
        </div>)}
      </div>}
    </>}
    {publicTeamCount > 0 && <VisitingRow id="team" Icon={Users} title="Meet the team" sub={publicTeamCount === 1 ? '1 person at the club' : `${publicTeamCount} people at the club`} marker={<ChevronRight size={15} />} onClick={() => setTeamOpen(true)} />}
    {publicTeamCount > 0 && <BottomSheet open={teamOpen} onClose={() => setTeamOpen(false)} ariaLabelledBy="club-team-sheet-title">
      <div data-club-team-sheet style={{ padding: '0 16px 26px' }}>
        <div id="club-team-sheet-title" style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em', color: '#F8FAFC', marginBottom: 12 }}>The team</div>
        <BusinessTeamTab businessId={business.id} />
      </div>
    </BottomSheet>}
    {!!business.amenities?.length && <div className="club-visiting-amenities">{business.amenities.map((amenity, index) => <span key={`${index}-${amenity}`}>{amenity}</span>)}</div>}
    {!!socials.length && <div className="club-visiting-socials">{socials.map(({ key, Icon, label, buildUrl }) => <Button key={key} type="button" variant="ghost" size="icon" aria-label={label} onClick={() => {
      const value = business.social_links?.[key]?.trim();
      if (value) openExternalUrl(buildUrl(value));
    }}><Icon size={16} /></Button>)}</div>}
  </section>;
}