// @ts-nocheck
export * from './__b18original_useActorUnreadCounts.ts';
import {useSeed} from '@/__b18seeds';
export function useActorUnreadCounts(){useSeed('zero');return {countFor:()=>0}}
