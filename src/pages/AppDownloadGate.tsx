/**
 * WEB_HOMEPAGE_2: the public web homepage, shared by all three gate states.
 * Gate routing/context and invite attribution stay canonical. Every phone is a
 * real published screenshot in /web-home; live data uses only public RPCs.
 * ZERO TRAP: errors or zero courses hide proof and use unnumbered fallback copy;
 * pending figures reserve the proof height. Never fall back to platform reach.
 * The homepage no longer mirrors BootHold's identity band.
 */
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveGateState } from './gate/gateRoutes';
import { useGateContext } from './gate/useGateContext';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';
import { FALLBACK_PLAY_URL, FALLBACK_STORE_URL, fetchStoreLinks } from '@/lib/storeLinks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { fmt, useWebHomeFigures } from './gate/home/useWebHomeData';
import { HomeHero } from './gate/home/HomeHero';
import { RecentBelt } from './gate/home/RecentBelt';
import { CourseLookup } from './gate/home/CourseLookup';
import { ProofSection } from './gate/home/ProofSection';
import { WhySection } from './gate/home/WhySection';
import { Brand, BusinessSection, FaqSection, FinalSection, HomeFooter, HomeNav, HowSection } from './gate/home/HomeSections';
import '@/styles/web-home.css';
const MARK = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';
/** Both fallbacks stand on failed/mocked responses; no device detection. */
function useStoreLinks() {
  const [links,setLinks] = React.useState({ appStore:FALLBACK_STORE_URL, play:FALLBACK_PLAY_URL, business:null as string | null });
  React.useEffect(() => { let alive = true; fetchStoreLinks().then(l => { if (alive && l) setLinks({appStore:l.appStore ?? FALLBACK_STORE_URL,play:l.play ?? FALLBACK_PLAY_URL,business:l.business ?? null}); }).catch(() => {}); return () => { alive=false; }; },[]);
  return links;
}
const trackStoreTap = (store: 'app_store' | 'play_store', placement: 'hero' | 'final') => { void analyticsEvents.track('store_link_tapped',{surface:'download_gate',store,placement}); };
function StoreBadges({ appStore,play,placement }: { appStore:string; play:string; placement:'hero'|'final' }) {
  const { t } = useTranslation('common');
  return <div className="badges" data-store-badges="" id={placement === 'hero' ? 'get' : undefined} style={{display:'flex',flexWrap:'wrap',justifyContent:placement === 'hero' ? 'center' : 'flex-start',gap:10}}>{(['app_store','play_store'] as const).map(store => { const apple=store === 'app_store'; const label=t(apple ? 'gate.appStore' : 'gate.googlePlay',{defaultValue:apple ? 'Download clbhouz on the App Store' : 'Get clbhouz on Google Play'}); return <a key={store} href={apple ? appStore : play} aria-label={label} onClick={() => trackStoreTap(store,placement)}><img src={apple ? '/brand/apple-app-store-badge.svg' : '/brand/google-play-badge.svg'} alt={label} style={{display:'block',height:52,width:'auto'}} draggable={false}/></a>; })}</div>;
}
const AppDownloadGate: React.FC = () => {
  const location=useLocation(); const { t,i18n }=useTranslation('common'); const locale=i18n?.language || 'en';
  const state=React.useMemo(() => resolveGateState(location.pathname),[location.pathname]); const {data:ctx}=useGateContext(state);
  const links=useStoreLinks(); const figures=useWebHomeFigures();
  React.useEffect(() => { if (state.kind === 'invite' && state.code) safeLocalStorage.set('clbhouz_invite_ref',state.code); },[state]);
  const say=(key:string,text:string) => t(`webHome.${key}`,{defaultValue:text});
  const first=ctx?.found ? (ctx.first_name || ctx.display_name?.trim().split(/\s+/)[0]) : null;
  const name=ctx?.found ? (ctx.display_name || ctx.username) : null;
  let head=say('head','A global platform for golf,'); let headSoft: string | undefined=say('headSoft','used by the golfers who play it and the businesses behind it.');
  let lede=say('lede','Post your rounds, follow golfers and creators, and see how every course really plays. Free on iPhone and Android.');
  if (state.kind === 'invite') { headSoft=undefined; head=first ? say('inviteHead',`${first} invited you to clbhouz.`) : say('inviteAnonHead',"You're invited to clbhouz."); lede=first ? say('inviteLede',`Join free and land straight in ${first}'s circle: see each other's rounds, compare on the same courses, and find who else plays where you play.`) : say('inviteAnonLede',"Join free and see each other's rounds, compare on the same courses, and find who else plays where you play."); }
  else if (state.kind === 'profile' && name) { headSoft=undefined; head=say('profileHead',`${name} is on clbhouz.`); lede=say('profileLede','Follow their rounds, see where they play, and compare on the courses you share. Free on iPhone and Android.'); }
  const usable=!figures.isError && !!figures.data && Number(figures.data.courses_total) > 0; const count=usable && figures.data ? fmt(Number(figures.data.courses_total),locale) : null;
  const brand=<Brand mark={MARK} word={wordmark.url}/>;
  return <div className="web-home"><HomeNav brand={brand}/>
    <HomeHero head={head} headSoft={headSoft} lede={lede} badges={<StoreBadges {...links} placement="hero"/>} fine={say('fine','No handicap needed.')}/>
    <RecentBelt/><CourseLookup count={count}/><ProofSection figures={usable && figures.data ? figures.data : null}/><WhySection/>
    <BusinessSection href={links.business ?? '#get'}/><HowSection/><FaqSection/><FinalSection badges={<StoreBadges {...links} placement="final"/>}/>
    <HomeFooter brand={brand} terms={t('gate.terms',{defaultValue:'Terms'})} privacy={t('gate.privacy',{defaultValue:'Privacy'})}/></div>;
};
export default AppDownloadGate;
