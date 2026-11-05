import {beforeEach,afterEach,describe,it,expect,vi} from 'vitest';
import {render,screen,fireEvent,waitFor,cleanup} from '@testing-library/react';
import {QueryClient,QueryClientProvider} from '@tanstack/react-query';
import {MemoryRouter,useLocation} from 'react-router-dom';
vi.mock('react-i18next',()=>({initReactI18next:{type:'3rdParty',init:()=>{}},useTranslation:()=>({t:(_k:string,o?:{defaultValue?:string})=>o?.defaultValue??''})}));
const f=vi.hoisted(()=>({pro:true,settled:true,linked:true,kind:'tour_pro',hidden:false,rpc:vi.fn(),invalidate:vi.fn(),close:vi.fn(),toast:Object.assign(vi.fn(),{error:vi.fn()}),glance:vi.fn()}));
vi.mock('@/lib/whs/useOwnHandicapState',()=>({useOwnHandicapState:()=>({pro:f.pro,settled:f.settled,proKind:f.kind,proTour:'Alps Tour',proClub:'Sundridge Park',linked:f.linked,connected:f.linked,connection:f.linked?{id:'kept'}:null,trend:{current:4.2},anyError:false})}));
vi.mock('@/features/pro-verification/useMyProStatus',()=>({useMyProStatus:()=>({verified:true,verifiedAt:'2026-11-04T12:00:00Z',kind:f.kind,tour:'Alps Tour',club:'Sundridge Park'})}));
vi.mock('@/features/pro-verification/proMembersCache',()=>({invalidateProMembers:f.invalidate}));
vi.mock('@/features/pro-verification/useProMembers',()=>({useProMembers:()=>({members:new Map()})}));
vi.mock('@/hooks/useSupabaseSession',()=>({useSupabaseSession:()=>({user:{id:'me'},loading:false})}));
vi.mock('@/context/ActiveActorContext',()=>({useActiveActor:()=>({activeActor:{id:'me',type:'personal'}})}));
vi.mock('@/hooks/useUserProfile',()=>({useUserProfile:()=>({data:{hide_handicap_chip:f.hidden},isFetched:true,isError:false})}));
vi.mock('@/lib/whs/hooks',()=>({useHandicapHistory:()=>({data:[]})}));
vi.mock('@/features/chrome-v2/IndexGlance',()=>({IndexGlance:()=>{f.glance();return null;}}));
vi.mock('@/features/chrome-v2/ConnectGlance',()=>({ConnectGlance:()=>{f.glance();return null;}}));
vi.mock('@/features/search-v2/SearchOverlayV2',()=>({SearchOverlayV2:()=>null}));
vi.mock('@/components/header/PostingAsMenu',()=>({PostingAsMenu:()=>null}));
vi.mock('@/hooks/profile/useMemberRoundTotal',()=>({useMemberRoundTotal:()=>({state:'ok',total:12})}));
vi.mock('@/hooks/profile/useMemberFirstRoundYear',()=>({useMemberFirstRoundYear:()=>({state:'ok',year:2020})}));
vi.mock('@/integrations/supabase/client',()=>({supabase:{rpc:f.rpc}}));
vi.mock('@/lib/toast',()=>({toast:f.toast}));
import {HcpCell} from '@/features/chrome-v2/ChromeIsland';
import {SettingsHandicapCard} from '@/components/settings/SettingsHandicapCard';
import {ProStatusSheet} from '@/features/pro-verification/ProStatusSheet';
import {ScoresStandingSlot} from '@/features/explore-magazine/ConnectStandingInvite';
import {profileProTabs} from '@/features/pro-verification/profileProRules';
function Location(){return <output data-testid="location">{useLocation().pathname}</output>;}
let qc:QueryClient;
function mount(node:React.ReactNode){return render(<QueryClientProvider client={qc}><MemoryRouter>{node}<Location /></MemoryRouter></QueryClientProvider>);}
beforeEach(()=>{vi.clearAllMocks();qc=new QueryClient({defaultOptions:{queries:{retry:false}}});f.pro=true;f.settled=true;f.linked=true;f.kind='tour_pro';f.hidden=false;f.rpc.mockResolvedValue({error:null});});
afterEach(()=>{cleanup();qc.clear();});
describe('pro island',()=>{
 it.each([false,true])('shows PRO instead of index linked=%s',linked=>{f.linked=linked;mount(<HcpCell tone="dark" dividerColor="transparent"/>);expect(screen.getByRole('button',{name:'Your profile'}).textContent).toContain('Alps Tour');expect(screen.queryByRole('button',{name:/Handicap index/})).toBeNull();});
 it('teaching pro shows club even when chip hidden',()=>{f.kind='teaching_pro';f.hidden=true;mount(<HcpCell tone="dark" dividerColor="transparent"/>);expect(screen.getByRole('button',{name:'Your profile'}).textContent).toContain('Sundridge Park');});
 it('profile tap never opens a glance',()=>{mount(<HcpCell tone="dark" dividerColor="transparent"/>);fireEvent.click(screen.getByRole('button',{name:'Your profile'}));expect(screen.getByTestId('location').textContent).toBe('/profile');expect(f.glance).not.toHaveBeenCalled();});
 it('unknown renders no cell',()=>{f.settled=false;const v=mount(<HcpCell tone="dark" dividerColor="transparent"/>);expect(v.container.querySelector('button')).toBeNull();});
 it('amateur retains index',()=>{f.pro=false;mount(<HcpCell tone="dark" dividerColor="transparent"/>);expect(screen.getByRole('button',{name:'Handicap index 4.2'})).toBeInTheDocument();});
});
describe('pro handicap surfaces',()=>{
 it.each(['tour_pro','teaching_pro'] as const)('Settings has no figures or actions for %s',kind=>{const toggle=vi.fn();mount(<SettingsHandicapCard pro={{kind}} connection={null} connectionReady checked updating={false} profileError={false} onToggle={toggle} onManage={()=>{}}/>);const sw=screen.getByRole('switch');expect(sw).toBeDisabled();expect(sw).toHaveAttribute('aria-checked','false');fireEvent.click(sw);expect(toggle).not.toHaveBeenCalled();expect(document.querySelector('.st2-figures,.st2-connect,.st2-manage')).toBeNull();});
 it('connected pro has no Scores standing surface',()=>{const v=mount(<ScoresStandingSlot viewerId="me" pos={1}/>);expect(v.container.querySelector('output')?.previousElementSibling).toBeNull();});
 it.each(['tour_pro','teaching_pro'] as const)('both connection states hide the own Handicap tab for %s',kind=>{for(const linked of [false,true])expect(profileProTabs({user_id:'me',pro_kind:kind,pro_tour:null,pro_tour_code:null,pro_club:null,pro_player_id:null},true,linked).handicap).toBe(false);});
});
describe('pro self-removal',()=>{
 const open=()=>{mount(<ProStatusSheet userId="me" open onClose={f.close}/>);fireEvent.click(screen.getByRole('button',{name:'Stop showing me as a pro'}));};
 it('facts render and Keep it makes no call',()=>{open();expect(screen.getByText('4 Nov 2026')).toBeInTheDocument();fireEvent.click(screen.getByRole('button',{name:'Keep it'}));expect(f.rpc).not.toHaveBeenCalled();expect(f.close).not.toHaveBeenCalled();});
 it('Stop calls once and refreshes own/profile/public pro caches',async()=>{const invalid=vi.spyOn(qc,'invalidateQueries');open();fireEvent.click(screen.getByRole('button',{name:/^Stop$/}));await waitFor(()=>expect(f.close).toHaveBeenCalledOnce());expect(f.rpc).toHaveBeenCalledExactlyOnceWith('remove_own_pro_status');for(const key of [['profile'],['user-profile'],['my-pro-request','me'],['profile-pro-pending','me']])expect(invalid).toHaveBeenCalledWith({queryKey:key});expect(f.invalidate).toHaveBeenCalledOnce();expect(f.toast).toHaveBeenCalledWith("You're no longer shown as a pro");});
 it('error keeps sheet open',async()=>{f.rpc.mockResolvedValue({error:new Error('refused')});open();fireEvent.click(screen.getByRole('button',{name:/^Stop$/}));await waitFor(()=>expect(f.toast.error).toHaveBeenCalledWith('Could not update. Please try again.'));expect(f.close).not.toHaveBeenCalled();expect(screen.getByText('4 Nov 2026')).toBeInTheDocument();});
});