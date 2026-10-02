import { describe, expect, it } from 'vitest';
import { looksAutomated, MIN_FILL_MS } from './spam';
import { visitorKey } from './visitorKey';

describe('looksAutomated', () => {
  const opened = 1_000_000;

  it('lets through a person who took their time', () => {
    expect(
      looksAutomated({ trap: '', startedAt: opened }, opened + MIN_FILL_MS)
    ).toBe(false);
  });

  it('catches a bot that filled the hidden field', () => {
    expect(
      looksAutomated(
        { trap: 'https://spam.example', startedAt: opened },
        opened + 60_000
      )
    ).toBe(true);
  });

  it('catches a form sent faster than anyone could type it', () => {
    expect(
      looksAutomated({ trap: '', startedAt: opened }, opened + MIN_FILL_MS - 1)
    ).toBe(true);
  });

  it('treats a missing or malformed check as a bot', () => {
    expect(looksAutomated(undefined)).toBe(true);
    expect(looksAutomated({ trap: '' })).toBe(true);
    expect(looksAutomated({ trap: 3, startedAt: opened })).toBe(true);
    expect(looksAutomated({ trap: '', startedAt: Number.NaN })).toBe(true);
  });
});

describe('visitorKey', () => {
  it('is the same for the same visitor doing the same thing', () => {
    expect(visitorKey('203.0.113.7', 'contact')).toBe(
      visitorKey('203.0.113.7', 'contact')
    );
  });

  it('keeps each thing they do apart, and each visitor apart', () => {
    const key = visitorKey('203.0.113.7', 'contact');
    expect(visitorKey('203.0.113.7', 'dj-enquiry')).not.toBe(key);
    expect(visitorKey('203.0.113.8', 'contact')).not.toBe(key);
  });

  it('never writes the address down', () => {
    expect(visitorKey('203.0.113.7', 'contact')).not.toContain('203.0.113');
  });
});
