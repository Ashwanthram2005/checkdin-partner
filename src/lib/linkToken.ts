/** Accepts either the code itself or the whole link from the email, and returns the code. */
export function tokenFrom(input: string): string {
  const v = input.trim();
  if (!v) return '';
  try { return new URL(v).searchParams.get('token') ?? ''; } catch { /* not a link */ }
  return v.replace(/^token=/i, '');
}
