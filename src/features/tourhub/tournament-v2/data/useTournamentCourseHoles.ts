/** Existing Ben-run RPC; selected-event yardages only, no writes or seed fallback. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CourseHole } from './tournamentRules';
export function useTournamentCourseHoles(id:string|undefined){return useQuery({queryKey:['tournament-v3','course-holes',id],enabled:!!id,staleTime:300000,queryFn:async():Promise<CourseHole[]>=>{if(!id)return [];const {data,error}=await supabase.rpc('get_tournament_course_holes',{p_tournament_id:id});if(error)throw error;return data??[];}});}
