// @ts-nocheck
export * from './__b18original_hooks.ts';
import {useSeed} from '@/__b18seeds';
export function useWhsConnection(){return useSeed('connection')} export function useFriendLeaderboard(){return useSeed('friends')} export function useSentInvites(){return useSeed('sent')} export function useRoundDetail(){return useSeed('round')} export function useWhsCourseId(){return useSeed('courseId')}
