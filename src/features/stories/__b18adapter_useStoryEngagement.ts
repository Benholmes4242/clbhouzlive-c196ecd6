// @ts-nocheck
export * from './__b18original_useStoryEngagement.ts';
import {useSeed} from '@/__b18seeds';
export function useStoryEngagement(){useSeed('ready');return {isSettled:true,engagementFor:()=>({commentCount:0,likeCount:3})}}
