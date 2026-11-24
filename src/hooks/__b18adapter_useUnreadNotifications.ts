// @ts-nocheck
export * from './__b18original_useUnreadNotifications.ts';
import {useSeed} from '@/__b18seeds';
export function useUnreadNotifications(){return {hasUnread:false,unreadCount:useSeed('zero').data}}
