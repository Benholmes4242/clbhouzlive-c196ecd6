// @ts-nocheck
export * from './__b18original_usePostLikers.ts';
import {useSeed} from '@/__b18seeds';
export function usePostLikers(){const q=useSeed('likers');return {...q,likers:q.data}}
