/** ST1 masking is shared by Account and the rounds email receipt. */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}${'\u2022'.repeat(Math.max(2, local.length - 2))}@${domain}`;
}