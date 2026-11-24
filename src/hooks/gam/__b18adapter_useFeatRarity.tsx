// @ts-nocheck
export * from './__b18original_useFeatRarity.tsx';
import {useSeed} from '@/__b18seeds';
export function useRoundFeatRarity(){return useSeed('rarity').data}
