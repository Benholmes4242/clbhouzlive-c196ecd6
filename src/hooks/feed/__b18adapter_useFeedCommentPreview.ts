// @ts-nocheck
export * from './__b18original_useFeedCommentPreview.ts';
import {useSeed} from '@/__b18seeds';
export function useFeedCommentPreview(){return {map:useSeed('standings').data,isSettledFor:()=>true}}
