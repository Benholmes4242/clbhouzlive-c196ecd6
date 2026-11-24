/** Brief 17: explicit title rules, normalized fixtures, no live reads. */
import {describe,it,expect} from 'vitest';
import i18next from 'i18next';
import en from '@/locales/en/tourhub.json';
import {boardTitle,unfoldingTitle,unfoldingNarrative,numbersTitle,hardestTitle,playedCourseLine,fieldTitle,fieldStrength,momentsTitle,roundInPlay,notableKinds,boardHeadForm,unfoldingHeadForm,momentsRecordHeadForm,momentsPlainHeadForm,sharedLeadPair,unfoldingFallbackTitle} from '@/features/tourhub/tournament-v2/data/tournamentHeadRules';
import {leaderboardTitle,runnerUpTitle,livePicksTitle,livePicksEyebrow,picksEyebrowState,upcomingPicksTitle,teeTimesTitle,courseLeadTitle,par5Sentence} from '@/features/tourhub/components/overview-v3/heroHeadRules';
import type {BoardEntry} from '@/features/tourhub/leaderboard/BoardTable';
import type {TournamentMeta} from '@/features/tourhub/leaderboard/useTournamentMeta';
import type {PickFieldPlayer} from '@/features/tourhub/hooks/useTournamentPick';
import type {MomentType} from '@/features/tourhub/hooks/useEventMoments';
const i18n=i18next.createInstance();void i18n.init({lng:'en',initAsync:false,resources:{en:{tourhub:en}},interpolation:{escapeValue:false}});
const t=(key:string,opts?:Record<string,unknown>)=>i18n.t(key,{ns:'tourhub',...opts}) as string;
const row=(name:string,rounds:number[],position=1,status='active'):BoardEntry=>({id:name,player:{id:name,full_name:`X ${name}`},score:rounds.reduce((a,b)=>a+b,0),position,status,round_1:rounds[0],round_2:rounds[1],round_3:rounds[2],round_4:rounds[3]});
const meta={current_round:3,current_round_status:'inprogress'} as TournamentMeta;
const field=(ranks:(number|null)[]):PickFieldPlayer[]=>ranks.map((world_rank,i)=>({player_id:String(i),full_name:`Player ${i}`,world_rank,country:null,photo_url:null,headshot_override:null}));
const moments=(kinds:MomentType[])=>kinds.map(moment_type=>({moment_type}));
describe('Brief 17 shared hero title fixtures',()=>{
 it('Four within three of the lead',()=>expect(leaderboardTitle(t,[{name:'Lee',score:-14},...[-13,-12,-11,-11].map(score=>({name:'Other',score}))])).toBe('Four within three of the lead'));
 it('Scott is T4, three shots back',()=>expect(livePicksTitle(t,{kind:'behind',name:'Scott',pos:'T4',gap:3})).toBe('Scott is T4, three shots back'));
 it.each([['leads','Scott leads for us'],['level','Scott is T1, level with the lead']] as const)('live picks %s',(kind,expected)=>expect(livePicksTitle(t,kind==='leads'?{kind,name:'Scott'}:{kind,name:'Scott',pos:'T1'})).toBe(expected));
 it('no intro uses first pick tee',()=>expect(upcomingPicksTitle(t,3,{name:'Scott',weekday:'Saturday',time:'11:20'})).toBe('Scott off first, Saturday at 11:20'));
 it('no intro or tee uses counted fallback',()=>expect(upcomingPicksTitle(t,3,null)).toBe('Three picks, tee times to come'));
 it.each([['live','inPlay',true],['final','final',true],['suspended','suspended',false],['between','plain',false],['beforeTee','plain',false]] as const)('picks eyebrow %s',(stage,state,live)=>{expect(picksEyebrowState(stage)).toBe(state);expect(livePicksEyebrow(t,state,3).live).toBe(live);});
 it('delayed picks never show live dot',()=>{const state=picksEyebrowState('live',{delayedRound:3});expect(state).toBe('delayed');expect(livePicksEyebrow(t,state,3).live).toBe(false);});
 it('36 groups, all off the 1st',()=>expect(teeTimesTitle(t,Array.from({length:36},()=>({startingHole:1})))).toBe('36 groups, all off the 1st'));
 it('20 groups, off the 1st and 10th',()=>expect(teeTimesTitle(t,Array.from({length:20},(_,i)=>({startingHole:i%2?10:1})))).toBe('20 groups, off the 1st and 10th'));
 it('Par 72, 7,449 yards',()=>expect(courseLeadTitle(t,72,7449)).toBe('Par 72, 7,449 yards'));
});
describe('board head',()=>{
 it('final runner-up two back',()=>expect(boardTitle(t,[row('Lee',[-14]),row('Herbert',[-12],2)],'completed','Lee')).toBe('Herbert second, two back'));
 it('final playoff uses runner-up rule',()=>expect(boardTitle(t,[row('Lee',[-14]),row('Herbert',[-14],1)],'completed','Lee')).toBe(runnerUpTitle(t,[{name:'Lee',total:-14,champion:true},{name:'Herbert',total:-14,champion:false}],true)));
 it('missing champion does not invent runner-up',()=>expect(boardTitle(t,[{...row('Lee',[-14]),position_tied:true}],'completed',null)).toBe(''));
 it('live delegates active scoring rows',()=>expect(boardTitle(t,[row('Lee',[-14]),row('Smith',[-13],2),row('Out',[-14],1,'WD')],'live',null)).toBe('Smith within three of the lead'));
 it.each([['inprogress',true],['complete',false],['closed',false],['scheduled',false],['suspended',false]])('round live condition %s',(status,expected)=>expect(roundInPlay({...meta,current_round_status:String(status)})).toBe(expected));
});
describe('unfolding round-leader history',()=>{
 it('Lee has led after every round',()=>expect(unfoldingTitle(t,[row('Lee',[-5,-4,-5]),row('Smith',[-3,-5,-5],2)])).toBe('Lee has led after every round'));
 it.each([[[-5],[-5],'Lee and Smith level after one round'],[[-5,-4],[-5,-4],'Lee and Smith level after two rounds']] as const)('two leaders %s',(a,b,expected)=>expect(unfoldingTitle(t,[row('Lee',[...a]),row('Smith',[...b])])).toBe(expected));
 it.each([[[ -5 ],'Three level after one round'],[[-5,-4],'Three level after two rounds']] as const)('three leaders %s',(rounds,expected)=>expect(unfoldingTitle(t,['Lee','Smith','Scott'].map(n=>row(n,[...rounds])))).toBe(expected));
 it('one round sole leader',()=>expect(unfoldingTitle(t,[row('Lee',[-5]),row('Smith',[-4],2)])).toBe('Lee in front after round one'));
 it('takes first lead in latest round',()=>expect(unfoldingTitle(t,[row('Lee',[-3,-3,-6]),row('Smith',[-5,-3,-2],2)])).toBe('Lee leads for the first time'));
 it('sole lead begins in round two',()=>expect(unfoldingTitle(t,[row('Lee',[-3,-6,-5]),row('Smith',[-5,-2,-3],2)])).toBe('Lee has led since round two'));
 it('a tied middle round breaks sole-leader run',()=>expect(unfoldingTitle(t,[row('Lee',[-5,-3,-4,-4]),row('Smith',[-3,-5,-3,-3],2)])).toBe('Lee has led since round three'));
 it('missing histories yield no invented head',()=>expect(unfoldingTitle(t,[])).toBe(''));
 it('drops bold opening and trims next part only',()=>expect(unfoldingNarrative([{bold:true,text:'Lee leads by one.'},{text:' Leading after the first round.'},{text:' Smith is nearest.'}],'live')).toEqual([{text:'Leading after the first round.'},{text:' Smith is nearest.'}]));
 it('retains non-bold opening',()=>expect(unfoldingNarrative([{text:'Opening.'},{bold:true,text:'Name'}],'live')).toEqual([{text:'Opening.'},{bold:true,text:'Name'}]));
 it('completed narrative unchanged',()=>expect(unfoldingNarrative([{bold:true,text:'Won.'},{text:' More.'}],'completed')).toEqual([{bold:true,text:'Won.'},{text:' More.'}]));
});
describe('day and week counts',()=>{
 it('38 players under par today',()=>expect(numbersTitle(t,meta,'live',Array.from({length:38},(_,i)=>row(String(i),[-2,-1,-1])))).toBe('38 players under par today'));
 it.each([[0,'Nobody under par today'],[1,'One player under par today'],[4,'Four players under par today'],[12,'12 players under par today']])('today count %s',(count,title)=>expect(numbersTitle(t,meta,'live',Array.from({length:Number(count)},(_,i)=>row(String(i),[-2,-1,-1])))).toBe(title));
 it.each([[0,'Nobody under par in round three'],[1,'One player under par in round three'],[4,'Four players under par in round three']])('complete round count %s',(count,title)=>expect(numbersTitle(t,{...meta,current_round_status:'complete'},'live',Array.from({length:Number(count)},(_,i)=>row(String(i),[-2,-1,-1])))).toBe(title));
 it.each([[0,'Nobody finished under par'],[1,'One player finished under par'],[4,'Four players finished under par']])('week count %s',(count,title)=>expect(numbersTitle(t,meta,'completed',Array.from({length:Number(count)},(_,i)=>row(String(i),[-2,-1,1])))).toBe(title));
 it('TODAY authority and eliminated rows',()=>expect(numbersTitle(t,meta,'live',[{...row('Zero',[-2,-2,-2]),today:0,today_round:3},{...row('Stale',[-2,-2,-2]),today:-2,today_round:2},row('WD',[-2,-2,-2],1,'WD'),row('Good',[-2,-2,-1])])).toBe('One player under par today'));
});
describe('course and field',()=>{
 it.each([['live','The 17th is playing hardest'],['completed','The 17th played hardest']] as const)('course %s',(phase,title)=>expect(hardestTitle(t,17,phase)).toBe(title));
 it('course amount is separated without altering easiest parts',()=>{const parts=[{bold:true,text:'Hardest so far,'},{text:' amount'},{bold:true,text:'The 5th'},{text:', easiest.'}];expect(playedCourseLine(t,parts,.42,'live')).toEqual([{text:'So far, 0.42 shots over par. '},...parts.slice(2)]);expect(playedCourseLine(t,parts,.5,'completed')[0].text).toBe('Half a shot over par. ');});
 it('upcoming par5 sentences retain their own rule',()=>{expect(par5Sentence(t,4)).toBe('Four par 5s.');expect(par5Sentence(t,0)).toBe('No par 5s.');});
 it('18 of the top 50, 19 of the top 100',()=>expect(fieldTitle(t,field([...Array.from({length:18},(_,i)=>i+1),75,120]))).toBe('18 of the top 50, 19 of the top 100'));
 it.each([[[1],'One of the top 50, one of the top 100'],[[1,2,3,60],'Three of the top 50, four of the top 100'],[[60,70,80],'None of the top 50, three of the top 100'],[[101,0,null],'No top-100 players this week']] as const)('field branch %s',(ranks,title)=>expect(fieldTitle(t,field([...ranks]))).toBe(title));
 it('strength only keeps strong/light lead, not top10 sentence',()=>expect(fieldStrength([{text:'A strong field.',bold:true},{text:' Top50 facts.'},{text:' Four top10.'}])).toEqual([{text:'A strong field.',bold:true}]));
 it('middle field has no lead',()=>expect(fieldStrength([{text:'Eight top50.'}])).toEqual([]));
});
describe('moments priority and plural rules',()=>{
 it('Seven moments, two eagles',()=>expect(momentsTitle(t,moments(['eagle','eagle','streak','highlight','highlight','highlight','highlight']),'live')).toBe('Seven moments, two eagles'));
 it.each([['live','Three eagles so far'],['completed','Three eagles this week']] as const)('all eagles %s',(phase,title)=>expect(momentsTitle(t,moments(['eagle','eagle','eagle']),phase)).toBe(title));
 it.each(notableKinds)('kind %s precedes any lower priority',(kind)=>{const index=notableKinds.indexOf(kind);const lower=notableKinds[index+1]??'highlight';expect(momentsTitle(t,moments([kind,lower]),'live')).toBe(`Two moments, one ${kind==='record'?'course record':kind}`);});
 it.each(notableKinds)('kind %s plural',(kind)=>{const noun=t(`tournamentHead.moments.kinds.${kind}`,{count:2});expect(momentsTitle(t,moments([kind,kind]),'live')).toBe(`Two ${noun} so far`);});
 it('single eagle completed',()=>expect(momentsTitle(t,moments(['eagle']),'completed')).toBe('One eagle this week'));
 it('single unnotable moment',()=>expect(momentsTitle(t,moments(['winner']),'live')).toBe('One moment so far'));
 it('unnotable moments counted',()=>expect(momentsTitle(t,moments(['highlight','winner']),'completed')).toBe('Two moments this week'));
});

describe('Ben continuation: measured fallback choices',()=>{
 for(const [name,choice] of [['board',boardHeadForm],['unfolding',unfoldingHeadForm],['records',momentsRecordHeadForm],['plain moments',momentsPlainHeadForm]] as const){
  it.each([[1,false],[2,false],[3,true]])(`${name} measured %s lines`,(lines,fallback)=>expect(choice(Number(lines))).toBe(fallback));
 }
 it('only a two-player shared live lead qualifies',()=>{expect(sharedLeadPair([row('A',[-4]),row('B',[-4])])).toBe(true);expect(sharedLeadPair([row('A',[-4]),row('B',[-4]),row('C',[-4])])).toBe(false);});
 it('two round-leaders get the specified short title',()=>expect(unfoldingFallbackTitle(t,[row('Christiansen',[-5,-4,-5]),row('Featherstone',[-5,-4,-5])])).toBe('Two level after three rounds'));
 it('fallback retains the opening bold narrative',()=>expect(unfoldingNarrative([{bold:true,text:'Christiansen and Featherstone are level.'},{text:' More.'}],'live',true)).toEqual([{bold:true,text:'Christiansen and Featherstone are level.'},{text:' More.'}]));
 it('mixed course records shorten to records',()=>expect(momentsTitle(t,moments(['record','record','highlight','highlight','highlight','highlight','highlight']),'live','records')).toBe('Seven moments, two records'));
 it('one course record shortens to one record',()=>expect(momentsTitle(t,moments(['record','highlight']),'completed','records')).toBe('Two moments, one record'));
 it('last fallback is the plain total and phase suffix',()=>expect(momentsTitle(t,moments(['record','record','highlight']),'completed','plain')).toBe('Three moments this week'));
});
