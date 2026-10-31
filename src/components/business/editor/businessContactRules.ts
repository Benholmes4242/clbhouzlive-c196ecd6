/** BE3 owns address update shape and contact display. Shared create validation
 * remains contactFieldError; no country normalization is written on display. */
import { dbLocationPrecision, type AddressValue } from '../AddressAutocomplete';
import { COUNTRIES } from '@/constants/countries';
import { getCountryCode } from '../CountrySelector';
import type { PhoneValue } from '../PhoneInputWithDialCode';

export function addressPayload(address: AddressValue | null, now = new Date().toISOString()) {
  return { location: address?.label || null, address_label: address?.label || null,
    address_line1: address?.addressLine1 || null, address_line2: address?.addressLine2 || null,
    city: address?.city || null, region: address?.region || null, postcode: address?.postcode || null,
    country: address?.country || null, lat: address?.lat ?? null, lng: address?.lng ?? null,
    mapbox_place_id: address?.mapboxPlaceId || null, location_precision: dbLocationPrecision(address?.precision), location_updated_at: now };
}
export function pinPlace(address: AddressValue | null) {
  return address?.addressLine1 || address?.city || address?.label.split(',')[0] || '';
}
export function websiteDisplay(value: string) { return value.replace(/^https?:\/\//i, '').replace(/\/$/, ''); }
export function savedPhone(value: string, country: string | null): PhoneValue | null {
  if (!value) return null;
  const preferred = COUNTRIES.find(c => c.code === getCountryCode(country));
  const found = preferred && value.startsWith(preferred.dialCode) ? preferred : [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length).find(c => value.startsWith(c.dialCode));
  return { fullNumber: value, dialCode: found?.dialCode ?? '', localNumber: found ? value.slice(found.dialCode.length).trim() : value };
}