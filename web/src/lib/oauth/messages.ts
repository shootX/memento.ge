export const oauthUserMessages = {
  accessDeniedKa: "შესვლა გაუქმდა — სცადეთ ხელახლა.",
  stateMismatch: "oauth_state",
  generic: "oauth",
  cancelled: "oauth_cancelled",
} as const;

export function oauthErrorMessageKa(code: string | null): string | null {
  if (!code) return null;
  if (code === oauthUserMessages.cancelled) {
    return oauthUserMessages.accessDeniedKa;
  }
  if (code === oauthUserMessages.stateMismatch) return "უსაფრთხოების შემოწმება ვერ მოხერხდა.";
  if (code === oauthUserMessages.generic) return "შესვლა ვერ მოხერხდა — სცადეთ ხელახლა.";
  return null;
}
