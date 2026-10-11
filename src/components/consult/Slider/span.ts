import type { Range } from '@/lib/consult/engine';

/** A range's limits and step, as a slider takes them. */
export const span = ({ min, max, step }: Range) => ({ min, max, step });
