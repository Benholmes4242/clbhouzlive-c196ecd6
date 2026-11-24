// @ts-nocheck
export * from './__b18original_useContentReactions.ts';
import {useSeed} from '@/__b18seeds';
export function useContentReactions(){useSeed('ready');return {isSettled:true,stateFor:()=>({count:3,mine:false}),toggle:()=>{}}}
