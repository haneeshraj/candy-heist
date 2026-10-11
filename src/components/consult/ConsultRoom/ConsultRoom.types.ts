import type { ConsultCopy } from '@/content/consult/consult';
import type { Room } from '@/lib/consult/model';

export interface ConsultRoomProps {
  room: Room;
  copy: ConsultCopy;
  /** When the server made the page: what "open for 3 days" counts from. */
  renderedAt: number;
}
