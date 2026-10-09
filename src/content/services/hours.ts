import { hoursSchema, type Hours } from '@/lib/booking/hours';
import hoursData from './hours.json';

// The site's own hours, shown until Candy Haven publishes its own (see
// getServices.ts). How long a time is held while someone pays stays here
// either way: it's the site's setting, not Candy's.
//
// PLACEHOLDER HOURS: Tuesday, Thursday, Friday and Saturday at six times,
// as the booking page showed before it was connected. Candy sets his own
// in Haven.

export const fileHours: Hours = hoursSchema.parse(hoursData);
