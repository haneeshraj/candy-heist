import type { ServiceItem } from '@/content/services/catalogue';
import type { FlowContent } from '@/content/services/flows';

/** A line of the running summary: "Date · Thu 8 October". */
export interface SummaryRow {
  label: string;
  value: string;
}

/** What every step with the running summary hands to it. */
export interface SummaryProps {
  copy: FlowContent['summary'];
  item: ServiceItem;
  rows: SummaryRow[];
  price: string;
}
