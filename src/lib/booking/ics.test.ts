import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

describe('buildIcs', () => {
  it('writes one UTC event with escaped text and CRLF lines', () => {
    const ics = buildIcs(
      {
        uid: 'CH-TEST@candyheist.com',
        start: new Date('2026-10-08T17:00:00Z'),
        end: new Date('2026-10-08T18:30:00Z'),
        title: 'Production Session, with Candy Heist',
        description: 'Line one\nLine; two'
      },
      new Date('2026-09-28T12:00:00Z')
    );
    const lines = ics.split('\r\n');
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('DTSTART:20261008T170000Z');
    expect(lines).toContain('DTEND:20261008T183000Z');
    expect(lines).toContain('SUMMARY:Production Session\\, with Candy Heist');
    expect(lines).toContain('DESCRIPTION:Line one\\nLine\\; two');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
