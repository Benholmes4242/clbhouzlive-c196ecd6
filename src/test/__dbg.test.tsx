import React from 'react';
import { render } from '@testing-library/react';
import { it } from 'vitest';
import { ExploreCard } from '@/features/explore-magazine/ExploreCard';
const subject = { course_id:'c', course_name:'C', region:'R', sub_country:'S', country:'B', image_url:'https://x/y.jpg', pending:false } as never;
const story = { id:'s', kind:'story', ring:'world', lane:'news', score:1, consequence:null, subject, who:{user_id:'a',display_name:'A',photo_url:null,is_viewer:false}, facts:{ source:'Bunkered', headline:'H', standfirst:'S', published_at:new Date().toISOString() }, payload:{}, seen:false } as never;
it('dbg', () => {
  const { container } = render(<ExploreCard item={story} size="lead" shape={null} onTap={() => undefined} />);
  const sc = container.querySelector('[data-explore-story-scrim="true"]') as HTMLElement | null;
  console.log('SCRIM:', JSON.stringify(sc?.style.background));
  const sf = container.querySelector('[data-explore-standfirst="true"]') as HTMLElement | null;
  console.log('CLAMP:', JSON.stringify(sf?.style.getPropertyValue('-webkit-line-clamp')), JSON.stringify((sf?.style as never as Record<string,string>).webkitLineClamp));
});
