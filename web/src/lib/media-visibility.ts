/** Guest-facing surfaces only show approved media. */
export const GUEST_VISIBLE_MEDIA_STATUS = "approved" as const;

export function guestVisibleMediaWhere(eventId: string) {
  return { eventId, status: GUEST_VISIBLE_MEDIA_STATUS };
}

export function isGuestVisibleMediaStatus(status: string): boolean {
  return status === GUEST_VISIBLE_MEDIA_STATUS;
}
