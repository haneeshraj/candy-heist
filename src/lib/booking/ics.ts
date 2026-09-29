// A single-event iCalendar file for "Add to calendar", in UTC so every
// calendar app places it correctly without a VTIMEZONE block.

export interface CalendarEvent {
  uid: string;
  start: Date;
  end: Date;
  title: string;
  description?: string;
  location?: string;
}

const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');

// RFC 5545 text: escape \ ; , and newlines.
const escape = (value: string) =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');

export function buildIcs(event: CalendarEvent, now = new Date()): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Candy Heist//Sessions//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(event.start)}`,
    `DTEND:${stamp(event.end)}`,
    `SUMMARY:${escape(event.title)}`,
    event.description ? `DESCRIPTION:${escape(event.description)}` : null,
    event.location ? `LOCATION:${escape(event.location)}` : null,
    'END:VEVENT',
    'END:VCALENDAR'
  ];
  return lines.filter(Boolean).join('\r\n') + '\r\n';
}

/** Hands the file to the browser as a download. */
export function downloadIcs(filename: string, contents: string) {
  const url = URL.createObjectURL(
    new Blob([contents], { type: 'text/calendar;charset=utf-8' })
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
