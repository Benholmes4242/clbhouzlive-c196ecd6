// @ts-nocheck
export * from './__b18original_useRoundNetScores.ts';
import {useSeed} from '@/__b18seeds';
export function useRoundNetScores(){return useSeed('net').data} export function useRoundNetQuery(){return useSeed('net')}
