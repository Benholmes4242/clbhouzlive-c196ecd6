/**
 * WEB_HOMEPAGE_1: the public web homepage, shared by all three gate states.
 * Gate routing/context and invite attribution stay canonical. Fictional phones
 * stay static; live figures/search/cards use only the authorised public RPCs.
 * ZERO TRAP: errors or zero courses hide proof and use unnumbered fallback copy;
 * pending figures reserve the proof height. Never fall back to platform reach.
 * The homepage no longer mirrors BootHold's identity band.
 */
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resolveGateState } from './gate/gateRoutes';
import { useGateContext } from './gate/useGateContext';
import { safeLocalStorage } from '@/utils/safeLocalStorage';
import wordmark from '@/assets/clbhouz-wordmark.png.asset.json';
import { FALLBACK_PLAY_URL, FALLBACK_STORE_URL, fetchStoreLinks } from '@/lib/storeLinks';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { fmt, useWebHomeFigures, useWebCourseCard } from './gate/home/useWebHomeData';
import { HeroFeedPhone, HomePillars, ShareRoundSection, CreatorsSection, NetworkSection, CourseFeatureCopy, BusinessBand } from './gate/home/HomeIllustrations';
import { WebCourseCard } from './gate/home/WebCourseCard';
import { WebCourseSearch } from './gate/home/WebCourseSearch';
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
  return <div className="badges" data-store-badges="" id={placement === 'hero' ? 'get' : undefined} style={{display:'flex',flexWrap:'wrap',justifyContent:placement === 'hero' ? 'flex-start' : 'center',gap:10}}>{(['app_store','play_store'] as const).map(store => { const apple=store === 'app_store'; const label=t(apple ? 'gate.appStore' : 'gate.googlePlay',{defaultValue:apple ? 'Download clbhouz on the App Store' : 'Get clbhouz on Google Play'}); return <a key={store} href={apple ? appStore : play} aria-label={label} onClick={() => trackStoreTap(store,placement)}><img src={apple ? '/brand/apple-app-store-badge.svg' : '/brand/google-play-badge.svg'} alt={label} style={{display:'block',height:52,width:'auto'}} draggable={false}/></a>; })}</div>;
}
const AppDownloadGate: React.FC = () => {
  const location=useLocation(); const { t,i18n }=useTranslation('common'); const locale=i18n?.language || 'en';
  const state=React.useMemo(() => resolveGateState(location.pathname),[location.pathname]); const {data:ctx}=useGateContext(state);
  const links=useStoreLinks(); const figures=useWebHomeFigures(); const featured=useWebCourseCard(null);
  React.useEffect(() => { if (state.kind === 'invite' && state.code) safeLocalStorage.set('clbhouz_invite_ref',state.code); },[state]);
  const say=(key:string,text:string) => t(`webHome.${key}`,{defaultValue:text});
  const first=ctx?.found ? (ctx.first_name || ctx.display_name?.trim().split(/\s+/)[0]) : null;
  const name=ctx?.found ? (ctx.display_name || ctx.username) : null;
  let kicker=say('kicker','The home of golf, online'); let head=say('head',"Golf's clubhouse."); let lede=say('lede','Share your rounds, follow golfers and creators, connect with clubs and coaches, and see how every course really plays. All in one app, free on iPhone and Android.');
  if (state.kind === 'invite') { kicker=say('inviteKicker',"You've been invited"); head=first ? say('inviteHead',`${first} invited you to clbhouz.`) : say('inviteAnonHead',"You're invited to clbhouz."); lede=first ? say('inviteLede',`Join free and land straight in ${first}'s circle: see each other's rounds, compare on the same courses, and find who else plays where you play.`) : say('inviteAnonLede',"Join free and see each other's rounds, compare on the same courses, and find who else plays where you play."); }
  else if (state.kind === 'profile' && name) { kicker=say('profileKicker','On clbhouz'); head=say('profileHead',`${name} is on clbhouz.`); lede=say('profileLede','Follow their rounds, see where they play, and compare on the courses you share. Free on iPhone and Android.'); }
  const usable=!figures.isError && !!figures.data && figures.data.courses_total > 0; const count=usable && figures.data ? fmt(figures.data.courses_total,locale) : null;
  return <div className="web-home"><nav><div className="wrap"><a className="brand" href="#get"><img src={MARK} alt=""/><img src={wordmark.url} alt="clbhouz"/></a><a className="navlink" href="#business">{say('businessLink','For business')}</a><a className="pill" href="#get">{say('getApp','Get the app')}</a></div></nav><header className="hero"><div className="wrap"><div><div className="kicker">{kicker}</div><h1>{head.endsWith('.') ? head.slice(0,-1) : head}<span className="dot">.</span></h1><p className="lede">{lede}</p><StoreBadges {...links} placement="hero"/><p className="reassure"><b>{say('reassureBold','For every golfer, club and golf business.')}</b>{' '}{say('reassure','No handicap needed to join. Connect one whenever you like and your rounds post themselves.')}</p></div><div><HeroFeedPhone/></div></div></header><HomePillars/><section className="feat"><div className="wrap"><ShareRoundSection/><CreatorsSection/><NetworkSection/><div className="row flip"><div className="txt"><CourseFeatureCopy/><ul><li>{count ? say('courseCount',`${count} courses with reviews, photos and ratings`) : say('courseFallback','Every course, with reviews, photos and ratings')}</li><li>{say('hardestBullet',"The real hardest hole, not the scorecard's stroke index")}</li><li>{say('ownRead','Your own golf read hole by hole against the course')}</li></ul></div><div>{featured.data && !featured.isError && <WebCourseCard course={featured.data} phone/>}</div></div></div></section><WebCourseSearch placeholder={count ? say('searchCount',`Search ${count} courses`) : say('searchFallback','Search courses')}/><BusinessBand businessUrl={links.business}/>{figures.isPending ? <div className="proof proof-pending" aria-hidden/> : usable && figures.data ? <div className="proof" data-web-proof><div className="wrap">{([[figures.data.courses_total,'Courses'],[figures.data.rounds_total,'Rounds shared'],[figures.data.holes_total,'Holes played']] as const).map(([n,label]) => <div key={label}><div className="n fig">{fmt(n,locale)}</div><div className="l">{say(`figure.${label}`,label)}</div></div>)}<div className="live">{say('live','Live from the platform')}</div></div></div> : null}<section className="final"><div className="wrap"><div className="kicker">{say('free','Free on iPhone and Android')}</div><h2>{say('final','Pull up a chair in the clubhouse')}<span className="dot">.</span></h2><StoreBadges {...links} placement="final"/></div></section><footer><div className="wrap"><div className="sig">stay in play<span className="dot">.</span></div><a href="#business">{say('businessLink','For business')}</a><Link to="/terms">{t('gate.terms',{defaultValue:'Terms'})}</Link><Link to="/privacy">{t('gate.privacy',{defaultValue:'Privacy'})}</Link></div></footer></div>;
};
export default AppDownloadGate;
