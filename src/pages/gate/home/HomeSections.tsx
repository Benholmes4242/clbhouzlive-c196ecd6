import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Dotted, Phone } from './Phone';
const icon = (d: React.ReactNode) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>;
const TILES = [
  { t: 'Golf clubs', s: 'Club news, events and who plays your course', i: icon(<><path d="M6 21V4"/><path d="M6 4l11 4-11 4"/></>) },
  { t: 'Coaches & pros', s: 'Lessons, and your pupils’ rounds', i: icon(<><circle cx="12" cy="7" r="3.2"/><path d="M5 20c.8-3.6 3.6-5.6 7-5.6s6.2 2 7 5.6"/></>) },
  { t: 'Resorts', s: 'Reach golfers planning their next trip', i: icon(<><path d="M3 20h18"/><path d="M5 20V9l7-5 7 5v11"/><path d="M10 20v-5h4v5"/></>) },
  { t: 'Brands & retail', s: 'Your posts in golfers’ feeds', i: icon(<><path d="M4 11V4h7l9 9-7 7z"/><circle cx="8" cy="8" r="1.4"/></>) },
];
export function BusinessSection({ href }: { href: string }) {
  return <section className="biz" id="business"><div className="wrap"><div className="bizcard">
    <div className="crest">{TILES.map(x => <div className="tile" key={x.t}><span className="ti">{x.i}</span><b>{x.t}</b><span>{x.s}</span></div>)}</div>
    <div><div className="sk" style={{ fontSize: 11 }}>For golf clubs, coaches and brands</div><h2 className="disp" style={{ marginTop: 14 }}><Dotted text="Put your business where golfers are."/></h2>
      <p>A free profile that golfers follow. Post your news, events and offers straight into their feed, and see who plays your course.</p>
      <div className="soonrow"><span className="soon">SOON</span>Tee time and lesson bookings</div><a className="cta" href={href} data-web-business="">clbhouz for business</a></div>
  </div></div></section>;
}
const big = (d: React.ReactNode) => <svg width="56" height="56" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>{d}</svg>;
const HOW = [
  { t: 'Download clbhouz', p: 'Free on iPhone and Android. Join with your email, Google or Apple in a few seconds.', i: big(<><rect x="18" y="6" width="28" height="52" rx="7"/><path d="M28 50h8"/></>) },
  { t: 'Find your course', p: 'Pick your home course and the people you play with, and your feed fills up straight away.', i: big(<><path d="M20 58V8"/><path d="M20 10l26 9-26 9"/><ellipse cx="32" cy="57" rx="20" ry="4"/></>) },
  { t: 'Play and share', p: 'Connect your handicap and rounds post themselves, or share photos, video and reviews any time.', i: big(<><circle cx="32" cy="32" r="22"/><path d="M26 22l14 10-14 10z"/></>) },
  { t: 'See how you compare', p: 'Against your friends, the course record and how the course really plays for everyone.', i: big(<><path d="M8 50l14-14 10 8 20-22"/><path d="M40 22h12v12"/></>) },
];
export function HowSection() {
  return <section className="how" id="how"><div className="wrap"><h2 className="disp"><Dotted text="How it works."/></h2>
    <p className="sub">clbhouz is built for every golfer, whether you play twice a year or twice a week. No handicap needed, and nothing to set up before you start looking around.</p>
    <a className="cta" href="#get" style={{ marginTop: 30 }}>Get the app</a>
    <div className="four">{HOW.map(x => <div key={x.t}>{x.i}<h3>{x.t}</h3><p>{x.p}</p></div>)}</div></div></section>;
}
const FAQS: [string, string][] = [
  ['Is clbhouz free?', 'Yes. clbhouz is free to download and free to use, on iPhone and Android.'],
  ['Do I need a handicap to join?', 'No. You can post rounds, photos, video and reviews, follow golfers, creators and clubs, and look up any course without one. If you have an official handicap you can connect it whenever you like, and your rounds will arrive on their own, scored hole by hole.'],
  ['Which handicap can I connect?', 'Today you can connect an England Golf handicap, the one you use in MyEG, iPlay or iGolf. France and the United States are coming next, with more countries to follow.'],
  ['Can my golf club or business join?', 'Yes. Clubs, coaches, pros, resorts and brands get a free business profile that golfers can follow, with news, events and offers posted straight into their feed. Tee times and lessons are coming next.'],
  ['I make golf videos. Is clbhouz for me?', 'Yes. Creator profiles put your videos on the course and hole they were filmed on, beside your real rounds, so golfers who are about to play that course find you.'],
  ['How do you know how a course really plays?', "From real rounds. Every round shared on clbhouz is scored hole by hole, so once enough golfers have played a course we can show which hole actually costs the most shots, not just what the scorecard's stroke index says."],
  ['Does clbhouz have the professional tours?', 'Yes. Live leaderboards, schedules and tour news sit alongside your own golf in the app.'],
];
export function FaqSection() {
  const [open, setOpen] = useState<Set<number>>(() => new Set([0]));
  const toggle = (i: number) => setOpen(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n; });
  return <section className="faq" id="faq"><div className="wrap grid"><h2 className="disp">Everything you want to know about clbhouz</h2><div>{FAQS.map(([q, a], i) => <div key={q} className={`qa ${open.has(i) ? 'open' : ''}`}>
    <button type="button" aria-expanded={open.has(i)} aria-controls={`faq-a-${i}`} onClick={() => toggle(i)}>{q}<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden><path d="M6 9l6 6 6-6"/></svg></button>
    <div className="a" id={`faq-a-${i}`}>{a}</div></div>)}</div></div></section>;
}
export function FinalSection({ badges }: { badges: React.ReactNode }) {
  return <section className="final"><div className="wrap grid" style={{ position: 'relative' }}>
    <div className="duo"><Phone shot="scorecard" style={{ left: '4%', top: 40, transform: 'rotate(-4deg) scale(.92)' }}/><Phone shot="feed" style={{ left: '34%', top: 0, zIndex: 2 }}/></div>
    <div><h2 className="disp"><Dotted text="clbhouz."/><br/><span className="two"><Dotted text="a new way."/></span></h2>
      <p>Your rounds, your courses, your golf network and the golfers you love watching. All in one app, free on iPhone and Android.</p>{badges}
      <div style={{ marginTop: 16, fontSize: 15, color: 'var(--dim)' }}>Free to join. No handicap needed.</div></div></div></section>;
}
export function Brand({ mark, word }: { mark: string; word: string }) { return <a className="brand" href="#get"><img className="mark" src={mark} alt=""/><img className="word" src={word} alt="clbhouz"/></a>; }
export function HomeNav({ brand }: { brand: React.ReactNode }) {
  return <nav><div className="wrap">{brand}<div className="links"><a href="#why">Features</a><a href="#look">Courses</a><a className="opt" href="#how">How it works</a><a href="#business">For business</a><a className="opt" href="#faq">FAQ</a></div><a className="cta" href="#get">Get the app</a></div></nav>;
}
export function HomeFooter({ brand, terms, privacy }: { brand: React.ReactNode; terms: string; privacy: string }) {
  return <footer><div className="wrap"><div className="grid">
    <div>{brand}<div className="tag">stay in play.</div></div>
    <div><h4>Find out more</h4><ul><li><a href="#why">Why clbhouz</a></li><li><a href="#look">Look up a course</a></li><li><a href="#how">How it works</a></li><li><a href="#faq">FAQ</a></li></ul></div>
    <div><h4>For business</h4><ul><li><a href="#business">Golf clubs</a></li><li><a href="#business">Coaches & pros</a></li><li><a href="#business">Resorts & brands</a></li></ul></div>
    <div><h4>Company</h4><ul><li><Link to="/terms">{terms}</Link></li><li><Link to="/privacy">{privacy}</Link></li></ul></div></div>
    <div className="legal" data-web-legal="">© {new Date().getFullYear()} CLBHOUZ LTD. Registered in England and Wales, company number 16529152. 60 Cannon Street, London EC4N 6NP.</div></div></footer>;
}
