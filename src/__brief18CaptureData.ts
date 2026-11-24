import { QueryClient, useQuery } from '@tanstack/react-query';
export const cache = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, gcTime: Infinity, retry: false, refetchOnMount: false, refetchOnWindowFocus: false, refetchOnReconnect: false } } });
export const uid = 'fixture-viewer';
export const cid = 'fixture-course';
export const user = { id: uid, is_anonymous: false, user_metadata: {} };
export const photo = '/web-home/course.webp';
export const course = { id: cid, name: 'Sundridge Park', country: 'England', sub_country: 'Kent', region: 'GB&I', website_url: 'https://example.com', thumbnail_image: null };
export const scores = { design: 8.5, condition: 8, clubhouse: 7.5, facilities: 8 };
export const holes = Array.from({length: 18}, (_, i) => ({ hole_no: i+1, par: 4, yards: 380+i*2, stroke_index: i+1, rounds: 120, avg_to_par: .4+(i%6)*.15, avg_gross: 4.4+(i%6)*.15, dist: { ace:0, albatross:0, eagle:1, birdie:12, par:65, bogey:32, double:10 } }));
export const myholes = holes.map(h => ({ hole_no: h.hole_no, par:h.par, times_played:12, avg_to_par:.25+(h.hole_no%5)*.1, best_to_par:-1, birdie_count:2, eagle_or_better_count:0, ace_count:0, par_count:7, bogey_count:2, double_plus_count:1 }));
export const roundholes = holes.map(h => ({holeNo:h.hole_no, par:h.par, strokes: h.hole_no === 3 ? 1 : h.hole_no%6===0 ? 5 : 4, played:true, fieldAvg:h.avg_gross}));
const award = { award_kind:'new_best',unit_kind:'round_gross',unit_key:0,tier:'gold',value:72,previous_value:74,delta:2,rank_here:1,attempts:12 };
export const results = { awards:[award,{...award,unit_kind:'hole',unit_key:3,value:-3,previous_value:-1}], efforts:[{unit_kind:'round_gross',value:72,rank_here:1,top_ten:true,attempts:12},{unit_kind:'front_nine',value:-1,rank_here:2,top_ten:true,attempts:12},{unit_kind:'back_nine',value:1,rank_here:3,top_ten:true,attempts:12}] };
export const reviewRows = Array.from({length:12},(_,i)=>({id:`review-${i}`, user_id:`peer-${i}`, rating:8,design_score:8,condition_score:8,clubhouse_score:8,facilities_score:8,is_mock:false}));
export const picker = (id:string,name:string,count=12) => ({id,name,region:'GB&I',subCountry:'Scotland',country:'United Kingdom',thumbnail:null,avg:8.4,count,mine:null,rank:'GB&I #12'});
export const idle = {recent:[picker('recent','Royal County Down (Championship)')],threshold:[picker('threshold','Royal Lytham & St Annes',2)],popular:[picker('popular','St Andrews (Old Course)')]};
export const likers = [
 {userId:uid,actorId:uid,actorType:'personal',displayName:'Alex Morgan',username:'alex',avatarUrl:null,handicapIndex:7.4,businessType:null,isFollowing:false,isViewer:true},
 {userId:'friend',actorId:'friend',actorType:'personal',displayName:'Sam Rae',username:'sam',avatarUrl:null,handicapIndex:9.2,businessType:null,isFollowing:true,isViewer:false},
 {userId:'other',actorId:'other',actorType:'personal',displayName:'Charlie Smith',username:'charlie',avatarUrl:null,handicapIndex:12.1,businessType:null,isFollowing:false,isViewer:false},
];
export const argumentRow = (id:string,name:string,memberRank:number,listRank:number) => ({id,name,imageUrl:null,publishedRank:listRank,rating:8.4,ratingCount:12,memberRank,listRank,divergence:listRank-memberRank});
export const argument = [argumentRow('a','Royal County Down (Championship)',1,5),argumentRow('b','Royal Lytham & St Annes',9,3)];
export const t100courses = [{id:'tc1',name:'St Andrews (Old Course)',country:'Scotland',region:'GB&I',thumbnail_image:null,list_memberships:[{list_slug:'global',rank:1}]},{id:'tc2',name:'Royal County Down (Championship)',country:'Northern Ireland',region:'GB&I',thumbnail_image:null,list_memberships:[{list_slug:'global',rank:2}]}];
const enrich = {rating:8.4,ratingCount:12,roundsTracked:120,playerCount:25,yourRounds:3,yourBest:74,avgOverPar:8,subScores:{design:8,condition:8,clubhouse:8,facilities:8},harderThanPct:45,recordGross:68,recordHolder:null,players:[],ratedByYou:false};
const seeds: Record<string,unknown> = {
 session:{user,session:null,loading:false},profile:{profile:{id:uid,display_name:'Alex Morgan'},loading:false},
 stats:{rounds_tracked:120,your_rounds:12,avg_gross:80,avg_over_par:8,course_par:72,best_gross:68,unique_players:25},analysis:{available:true,total_rounds:120,holes},myholes,
 breakdown:{rounds:12,total_over_par:7.5,holes:myholes.map(h=>({...h,par_or_better:9,bogeys:2,doubles_plus:1}))},
 rounds:{total:12,rounds:Array.from({length:6},(_,i)=>({whsScoreId:`round-${i}`,playDate:i<3?`2026-11-${20-i}`:`2025-11-${20-i}`,grossScore:74+i,coursePar:72,teeMarker:'White',hcpAtTime:7.4}))},
 legends:['lowest_gross_all_time','most_rounds_all_time','best_stableford_all_time','most_birdies_all_time','best_score_diff_all_time'].map((category,i)=>({category,rank:1,user_id:`holder-${i}`,user_display_name:['Sam Rae','Charlie Smith','Jordan King','Taylor Green','Casey Brown'][i],user_photo_url:null,is_self:false,value:[68,64,44,7,-1.2][i],attained_at:'2026-10-01'})),
 memberships:[],club:{id:'fixture-club',name:course.name},reviews:reviewRows,media:{photos:28,videos:6,total:34},unanswered:3,
 claim:{state:'unclaimed'},circle:[{user_id:'friend',display_name:'Sam Rae',profile_photo_url:null,rounds:3,best_gross:76,best_to_par:4}],handicap:{index:7.4,ready:true},personal:{status:'played',rating:8,hasPlayed:true,roundsCount:12,setWantToPlay:()=>{}},band:{avg_gross:80,avg_over_par:8,rounds:40},
 rated:[{course_id:'recent-rated',course_name:'St Andrews (Old Course)',country:'Scotland',sub_country:'Fife',thumbnail_image:null,community_rating:8.8,review_count:12}],
 likers,standing:new Map(),receipt:{community_avg:8,rating_count:12,avg_before:8,subscore_threshold_met:true,top100_rank:12,top100_list:'GB&I',your_rated_in_list:8,your_rank_of_rated:2,your_total_rated:10},idle,
 config:{enabled:false,minRatings:3,threshold:.5,anchor:9.36,slope:.01,subscoreMinRatings:3,minPlayed:5,bandLow:40,bandHigh:60},
 t100courses:{pages:[t100courses],pageParams:[0]},enrichment:new Map([['tc1',enrich],['tc2',{...enrich,rating:null,ratingCount:1}]]),holders:{map:new Map(),players:new Map()},progress:{lists:[{listSlug:'global',played:8,total:100,rated:5}]},baseline:new Map(),
};
Object.entries(seeds).forEach(([k,v]) => cache.setQueryData<unknown>(['brief18-fixture',k],v));
export function useSeed(key:string) { return useQuery({queryKey:['brief18-fixture',key],queryFn:()=>Promise.reject(new Error(`Unseeded fixture ${key}`)),staleTime:Infinity}); }

cache.setQueryData(['golf-club','fixture-club'],{id:'fixture-club',name:course.name});
cache.setQueryData(['review-course-idle',uid,3],idle);
cache.setQueryData(['review-course-idle',null,3],idle);
