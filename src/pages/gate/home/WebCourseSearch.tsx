import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyticsEvents } from '@/utils/analyticsEvents';
import { courseArea, useWebCourseCard, useWebCourseHits } from './useWebHomeData';
import { WebCourseCard } from './WebCourseCard';
export function WebCourseSearch({ placeholder }: { placeholder: string }) {
  const { t } = useTranslation('common');
  const [text, setText] = useState(''); const [query,setQuery] = useState(''); const [chosen,setChosen] = useState<string | null>(null);
  useEffect(() => { const timer = setTimeout(() => { setQuery(text.trim()); setChosen(null); },250); return () => clearTimeout(timer); },[text]);
  const { popular, hits } = useWebCourseHits(query);
  const selected = chosen ?? hits[0]?.id ?? null;
  const card = useWebCourseCard(selected, !!selected);
  if (popular.isError || (!popular.isPending && !popular.data?.length)) return null;
  return <section className="find"><div className="wrap"><div className="findbox"><div><div className="kicker">{t('webHome.try',{defaultValue:'Try it'})}</div><h2>{t('webHome.lookup',{defaultValue:'Look up your course'})}<span className="dot">.</span></h2><p className="find-intro">{t('webHome.lookupIntro',{defaultValue:'See what golfers say about it, and how it really plays, before you download anything.'})}</p><div className="search"><Search size={18} aria-hidden/><input aria-label={t('webHome.searchLabel',{defaultValue:'Search courses'})} placeholder={placeholder} value={text} onChange={e => setText(e.target.value)} autoComplete="off"/></div>{!text.trim() && <div className="hitlabel">{t('webHome.popular',{defaultValue:'Popular on clbhouz'})}</div>}<div className="hits">{hits.length ? hits.map(hit => <Button variant="ghost" className={`hit ${selected === hit.id ? 'on' : ''}`} key={hit.id} aria-pressed={selected === hit.id} onClick={() => { setChosen(hit.id); void analyticsEvents.track('web_course_card_viewed',{course_id:hit.id,source:query.length >= 2 ? 'search' : 'popular'}); }}><b>{hit.name}</b><span>{courseArea(hit)}</span></Button>) : <div className="hit">{t('webHome.noCourse',{defaultValue:'No course found'})}</div>}</div></div><div>{selected && card.data && !card.isError && <WebCourseCard course={card.data}/>}</div></div></div></section>;
}
