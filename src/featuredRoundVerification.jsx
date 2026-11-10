import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter} from 'react-router-dom';
import './index.css';
import './styles/theme.css';
import './styles/theme-tokens.css';
import './i18n';
import {FeaturedRoundCard} from './features/explore-magazine/FeaturedRoundCard';
const qc = new QueryClient({defaultOptions:{queries:{retry:false}}});
qc.setQueryData(['featured-round-net','fixture'],{netScore:68,courseHandicap:6});
const pars=[4,4,3,4,4,3,4,5,4,4,4,3,4,4,3,4,5,4];
const holes=pars.map((par,i)=>({holeNo:i+1,par,strokes:par+(i===3?2:i===7?3:0),strokeIndex:i+1}));
let cum=0;
const shape={holes,series:[0,...holes.map(h=>cum+=h.strokes-h.par)]};
const base={whs_score_id:'fixture',user_id:'author',display_name:'Alexandra Montgomery-Wellington',photo_url:null,course_id:'fixture-course',course_name:'Woburn Golf Club',play_date:'2026-11-04',gross:74,course_par:72,to_par:2,stableford:45,birdies:5,eagles:2,albatrosses:0,holes_in_one:0,clean_card:false,tier:2,reason:'course_record'};
function Fixture(){const [following,setFollowing]=useState(false);const [opens,setOpens]=useState(0);const reason=new URLSearchParams(location.search).get('reason')||'course_record';const tier=reason==='hole_in_one'?1:reason==='birdie_run'?3:2;return <div style={{width:'100%',padding:16,boxSizing:'border-box'}}><div data-verification-opens={opens} data-verification-followed={following}><FeaturedRoundCard round={{...base,tier,reason,holes_in_one:reason==='hole_in_one'?1:0,birdie_run:5}} viewerId="viewer" shape={shape} medals={{birdies:5}} onOpen={()=>setOpens(v=>v+1)} isFollowed={following} onFollow={()=>setFollowing(v=>!v)}/></div></div>}
createRoot(document.getElementById('root')).render(<QueryClientProvider client={qc}><MemoryRouter><Fixture/></MemoryRouter></QueryClientProvider>);
