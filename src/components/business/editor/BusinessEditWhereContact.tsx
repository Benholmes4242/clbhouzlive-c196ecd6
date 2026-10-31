/** BE3 owns local sheet drafts and pin handoff; parent owns protected writes,
 * saved state and dirty baseline. Create-mode location/contact is independent. */
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BizcSheet } from '@/features/business-create/BusinessCreateStep3';
import { AddressAutocomplete, type AddressValue } from '../AddressAutocomplete';
import { CountrySelector, getCountryCode } from '../CountrySelector';
import { PhoneInputWithDialCode, type PhoneValue } from '../PhoneInputWithDialCode';
import { PinDropModal } from '../PinDropModal';
import { MapPreview } from '@/components/map/MapPreview';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { contactFieldError } from '@/features/business-create/step3Rules';
import { pinPlace, savedPhone, websiteDisplay } from './businessContactRules';
import './business-where-contact.css';

export type ContactSheet = 'address' | 'phone' | 'email' | 'website';
export type ContactSave = { kind: 'address'; value: AddressValue | null } | { kind: 'phone'; value: PhoneValue | null } | { kind: 'email' | 'website'; value: string };
interface Props {
  address: AddressValue | null; country: string | null; phone: string; email: string; website: string;
  clubLinked: boolean; busy: boolean; requested: { kind: ContactSheet; serial: number } | null;
  onSave: (save: ContactSave) => Promise<boolean>;
}
export function BusinessEditWhereContact(props: Props) {
  const [sheet, setSheet] = useState<ContactSheet | null>(null);
  const [draftAddress, setDraftAddress] = useState(props.address);
  const [country, setCountry] = useState(props.country);
  const [phone, setPhone] = useState<PhoneValue | null>(null);
  const [text, setText] = useState('');
  const [unresolved, setUnresolved] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [requestSerial, setRequestSerial] = useState<number | null>(null);
  const open = (kind: ContactSheet) => {
    if (props.busy || (kind === 'address' && props.clubLinked)) return;
    setDraftAddress(props.address); setCountry(props.country); setUnresolved(false);
    setPhone(savedPhone(props.phone, props.country)); setText(kind === 'email' ? props.email : props.website);
    setSheet(kind);
  };
  // Arrival requests are consumed once, without resetting an open sheet draft.
  if (props.requested && props.requested.serial !== requestSerial) {
    setRequestSerial(props.requested.serial); open(props.requested.kind);
  }
  const save = async () => {
    const operation: ContactSave = sheet === 'address' ? { kind: 'address', value: draftAddress }
      : sheet === 'phone' ? { kind: 'phone', value: phone } : { kind: sheet === 'email' ? 'email' : 'website', value: text.trim() };
    if (await props.onSave(operation)) setSheet(null);
  };
  const row = (label: string, value: string, placeholder: string, onClick?: () => void) => {
    const content = <><span className="ep-row-label">{label}</span><span className={`ep-row-value${value ? '' : ' ph'}`}>{value || placeholder}{label === 'Address' && props.clubLinked && <span className="be3-lock"> · from your club</span>}</span>{onClick && <ChevronRight size={18} aria-hidden />}</>;
    return onClick ? <Button type="button" variant="ghost" className="ep-row" disabled={props.busy} onClick={onClick}>{content}</Button> : <div className="ep-row">{content}</div>;
  };
  const activeAddress = sheet === 'address' ? draftAddress : props.address;
  const hasPin = activeAddress?.lat != null && activeAddress.lng != null;
  const error = sheet === 'email' || sheet === 'website' ? contactFieldError(sheet, text) : null;
  return <>
    <section className="be3-groups">
      <h2 className="ep-group">Where</h2><div className="ep-rows">
        {row('Address', props.address?.label || '', 'Add your address', props.clubLinked ? undefined : () => open('address'))}
        {!props.clubLinked && row('Map pin', props.address?.lat != null && props.address.lng != null ? `Placed on ${pinPlace(props.address)}` : '', 'Not placed', () => setPinOpen(true))}
      </div>
      <h2 className="ep-group">Contact</h2><div className="ep-rows">
        {row('Phone', props.phone, 'Add a number', () => open('phone'))}
        {row('Email', props.email, 'Add an email', () => open('email'))}
        {row('Website', websiteDisplay(props.website), 'Add your website', () => open('website'))}
      </div>
    </section>
    {sheet && <BizcSheet title={{ address: 'Address', phone: 'Phone', email: 'Email', website: 'Website' }[sheet]} testId="be3-contact-sheet" onDone={() => setSheet(null)} onAction={() => void save()} actionDisabled={props.busy || unresolved || !!error}>
      <div className="be3-sheet">
        {sheet === 'address' ? <>
          <div className="be3-fld"><span>Country</span><CountrySelector className="be3-country" value={country} onChange={name => { setCountry(name); setDraftAddress(null); setUnresolved(true); }} /></div>
          <div className="be3-fld"><span>Street and postcode</span><AddressAutocomplete key={country} value={draftAddress} countryCode={getCountryCode(country)} bare neutral placeholder="Start typing a street or postcode" onChange={setDraftAddress} onUnresolvedChange={setUnresolved} onDropPinClick={() => setPinOpen(true)} /></div>
          {hasPin && activeAddress && <><div className="be3-map"><MapPreview lat={activeAddress.lat ?? 0} lng={activeAddress.lng ?? 0} height={150} markerColor={A.INK} showExpandButton={false} /></div><div className="be3-mapfoot"><span>Pin on {pinPlace(activeAddress)}</span><Button variant="ghost" className="be3-text-button" onClick={() => setPinOpen(true)}>Move pin</Button></div><p className="be3-helper">Golfers get directions to the pin, so drag it onto your door if it's off.</p></>}
        </> : sheet === 'phone' ? <><PhoneInputWithDialCode fieldBoxes value={phone} onChange={setPhone} defaultCountryIso={getCountryCode(props.country)} /><p className="be3-helper">Golfers can tap to call you. Leave it empty to hide it.</p></> : <>
          <label className="be3-fld"><span>{sheet === 'email' ? 'Email' : 'Website'}</span><input type={sheet === 'email' ? 'email' : 'url'} aria-label={sheet === 'email' ? 'Email' : 'Website'} value={text} onChange={event => setText(event.target.value)} /></label>
          {error && <p className="be3-error">{error}</p>}{sheet === 'website' && <p className="be3-helper">Shown on your profile.</p>}
        </>}
      </div>
    </BizcSheet>}
    <PinDropModal open={pinOpen} onOpenChange={setPinOpen} initialCenter={hasPin && activeAddress ? { lat: activeAddress.lat ?? 0, lng: activeAddress.lng ?? 0 } : undefined} onConfirm={value => {
      if (sheet === 'address') { setDraftAddress({ ...draftAddress, ...value }); setCountry(value.country || country); setUnresolved(false); }
      else void props.onSave({ kind: 'address', value: { ...props.address, ...value } });
    }} />
  </>;
}