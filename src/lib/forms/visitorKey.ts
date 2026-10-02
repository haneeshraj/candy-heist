import { createHash } from 'node:crypto';

/**
 * A visitor, as a key for an hourly limit: their address and what they were
 * doing, hashed, so the address itself is never written down. The entry
 * expires within the hour anyway.
 */
export function visitorKey(address: string, purpose: string): string {
  return createHash('sha256')
    .update(`candy-heist\u0000${purpose}\u0000${address}`)
    .digest('hex');
}
