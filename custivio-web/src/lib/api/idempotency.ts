export function createIdempotencyKey(prefix = "frontend"): string {
  const random = crypto.randomUUID();
  return `${prefix}-${random}`;
}
