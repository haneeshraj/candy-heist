import type {
  ServicesDoor,
  ServicesPageContent
} from '@/content/services/services';

export interface ServicesPageProps {
  content: ServicesPageContent;
}

export interface ServiceDoorProps {
  door: ServicesDoor;
  /** Its place, from 0: the first door's photo loads first. */
  index: number;
}
