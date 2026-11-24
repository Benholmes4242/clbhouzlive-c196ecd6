// @ts-nocheck
export * from './__b18original_useProfileData.ts';
import {useSeed} from '@/__b18seeds';
export function useProfileData(){return {profile:useSeed('profile').data,loading:false,isLoading:false}}
