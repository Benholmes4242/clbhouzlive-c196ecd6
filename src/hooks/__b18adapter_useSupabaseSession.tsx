// @ts-nocheck
export * from './__b18original_useSupabaseSession.tsx';
import {useSeed} from '@/__b18seeds';
export function useSupabaseSession(){return {user:useSeed('user').data,session:null,loading:false}}
