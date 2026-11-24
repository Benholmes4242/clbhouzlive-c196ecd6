// @ts-nocheck
export * from './__b18original_useReviewCourseSearch.ts';
import {useSeed} from '@/__b18seeds';
export function useReviewCourseIdle(){return useSeed('search')} export function useReviewCourseResults(){return {...useSeed('results'),term:''}}
