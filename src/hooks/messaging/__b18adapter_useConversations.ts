// @ts-nocheck
export * from './__b18original_useConversations.ts';
import {useSeed} from '@/__b18seeds';
export function useConversations(){return {conversations:useSeed('empty').data}}
