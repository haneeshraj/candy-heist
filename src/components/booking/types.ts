import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowCopy } from '@/content/services/flows';

/** A line of the running summary: "Date · Thu 8 October". */
export interface SummaryRow {
  label: string;
  value: string;
}

/** What every step with the running summary hands to it. */
export interface SummaryProps {
  copy: FlowCopy['summary'];
  item: ServiceItem;
  rows: SummaryRow[];
  /** What's paid now, beside the total's label. */
  price: string;
}
