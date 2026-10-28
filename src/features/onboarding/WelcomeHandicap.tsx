import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { WHS_COUNTRIES, type WhsCountry } from '@/lib/whs/whsCountries';
import { useHandicapWaitlist } from '@/components/profile/handicap/whs/connect/useHandicapWaitlist';
import MiniFlag from '@/components/profile/handicap/whs/connect/MiniFlag';
import CountryScreen from '@/components/profile/handicap/whs/connect/CountryScreen';
import WhsConnectScreen from '@/components/profile/handicap/whs/WhsConnectScreen';

/** OB1 embeds the canonical controller at credentials, using opt-in immediate
 * completion. Provider errors, credential safety and WHS analytics stay owned there. */
export function WelcomeHandicap({ userId, onConnected, onBusy }: { userId: string; onConnected: () => void; onBusy: (busy: boolean) => void }) {
  const { t } = useTranslation('auth'); const waitlist = useHandicapWaitlist(userId); const [country, setCountry] = useState<WhsCountry | null>(null); const [sheet, setSheet] = useState(false);
  const pick = (c: WhsCountry) => { setSheet(false); setCountry(c); onBusy(true); };
  if (country) return <div className="welcome-connect"><Button variant="ghost" onClick={() => { setCountry(null); onBusy(false); }}>{t('welcome.changeCountry', { defaultValue: 'Change country' })}</Button><WhsConnectScreen key={country.id} layout="embedded" initialCountryId={country.id} completeOnSuccess onConnected={onConnected} /></div>;
  if (!waitlist.isSettled && !waitlist.isError) return <p role="status">{t('welcome.loading', { defaultValue: 'Loading…' })}</p>;
  if (waitlist.isError) return <Button variant="ghost" onClick={() => void waitlist.refetch()}>{t('welcome.retry', { defaultValue: 'Try again' })}</Button>;
  const live = WHS_COUNTRIES.filter(c => c.supported); const agreed = WHS_COUNTRIES.filter(c => !c.supported && c.comingSoon); const rest = WHS_COUNTRIES.filter(c => !c.supported && !c.comingSoon);
  const row = (c: WhsCountry) => <Button variant="ghost" className="welcome-provider" key={c.id} aria-label={c.name} aria-pressed={!c.supported ? waitlist.joined.has(c.id) : undefined} onClick={() => c.supported ? pick(c) : waitlist.joined.has(c.id) ? waitlist.leave(c) : waitlist.join(c)}><MiniFlag iso={c.iso} /><span><b>{c.name}</b><small>{c.body}</small></span>{c.supported ? <b className="welcome-provider-action">{t('welcome.connect', { defaultValue: 'Connect ›' })}</b> : <span className="welcome-provider-badge">{t(waitlist.joined.has(c.id) ? 'welcome.waitlistJoined' : 'welcome.comingSoon', { defaultValue: waitlist.joined.has(c.id) ? 'On the list' : 'Coming soon' })}{waitlist.counts[c.id] != null && <small>{t('welcome.waiting', { count: waitlist.counts[c.id], defaultValue: `${waitlist.counts[c.id]} waiting` })}</small>}</Button>;
  return <div className="welcome-list welcome-authorities"><div className="welcome-group-label">{t('welcome.connectNow', { defaultValue: 'Connect now' })}</div>{live.map(row)}{agreed.length > 0 && <div className="welcome-group-label">{t('welcome.partnership', { defaultValue: 'Partnership agreed' })}</div>}{agreed.map(row)}{rest.length > 0 && <Button variant="ghost" className="welcome-provider" onClick={() => setSheet(true)}><span><b>{t('welcome.moreCountries', { count: rest.length, defaultValue: `${rest.length} more countries` })}</b><small>{rest.slice(0, 4).map(c => c.name).join(', ')}…</small></span><b>›</b></Button>}<Sheet open={sheet} onOpenChange={setSheet}><SheetContent side="bottom" className="welcome-country-sheet"><CountryScreen onSelect={pick} /></SheetContent></Sheet></div>;
}