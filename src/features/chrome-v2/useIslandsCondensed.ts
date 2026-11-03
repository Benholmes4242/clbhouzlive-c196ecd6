/** HEADER_B1: route opt-in consumes the existing nav store; no new scroll listener.
 * Standalone island renderers without a router retain their existing expanded state.
 */
import { useContext } from 'react';
import { UNSAFE_LocationContext } from 'react-router-dom';
import { useNavScrollState } from '@/hooks/useScrollDirection';
import { resolveChrome } from './registry';

export function useIslandsCondensed(): boolean {
  const context = useContext(UNSAFE_LocationContext);
  const state = useNavScrollState();
  if (!context) return false;
  const { pathname, search } = context.location;
  return resolveChrome(pathname, new URLSearchParams(search)).condense === true && state === 'condensed';
}