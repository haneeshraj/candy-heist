// @vitest-environment node
import { ObjectId } from 'mongodb';
import { describe, expect, it } from 'vitest';
import {
  cleanEnquiry,
  cleanMessage,
  messageDocument,
  messageForHaven
} from './documents';
import { newRef, REF_PATTERN } from './ref';
import { isEnquiryStatus, isMessageStatus } from './status';

describe('cleanMessage', () => {
  it('keeps only the form’s fields, trimmed', () => {
    const message = cleanMessage({
      name: '  Alex ',
      email: 'alex@nightfall.events',
      subject: 'Set',
      message: 'Hello',
      admin: true,
      $where: 'drop'
    });
    expect(message.name).toBe('Alex');
    expect(message).not.toHaveProperty('admin');
    expect(message).not.toHaveProperty('$where');
    expect(message.links).toBe('');
  });

  it('turns anything that isn’t text into an empty field', () => {
    const message = cleanMessage({ name: { $gt: '' }, email: 42 });
    expect(message.name).toBe('');
    expect(message.email).toBe('');
  });

  it('copes with nothing at all', () => {
    expect(cleanEnquiry(null).about).toBe('');
  });
});

describe('filing and handing over', () => {
  const now = new Date('2026-10-01T12:00:00.000Z');
  const message = cleanMessage({
    name: 'Alex',
    email: 'alex@nightfall.events',
    subject: 'Set',
    message: 'Hello'
  });

  it('files a message as new, under its ref', () => {
    const doc = messageDocument(message, 'MSG-7KQ2FD', now);
    expect(doc).toMatchObject({
      ref: 'MSG-7KQ2FD',
      status: 'new',
      name: 'Alex',
      createdAt: now,
      updatedAt: now
    });
  });

  it('hands Haven the id and dates as text', () => {
    const id = new ObjectId();
    const handed = messageForHaven({
      _id: id,
      ...messageDocument(message, 'MSG-7KQ2FD', now)
    });
    expect(handed.id).toBe(id.toHexString());
    expect(handed.createdAt).toBe('2026-10-01T12:00:00.000Z');
    expect(handed).not.toHaveProperty('_id');
  });
});

describe('refs and statuses', () => {
  it('draws refs that read cleanly', () => {
    for (let i = 0; i < 50; i++) {
      expect(newRef('MSG')).toMatch(REF_PATTERN);
      expect(newRef('DJ')).toMatch(/^DJ-/);
    }
  });

  it('knows each kind’s statuses', () => {
    expect(isMessageStatus('replied')).toBe(true);
    expect(isMessageStatus('in_talks')).toBe(false);
    expect(isEnquiryStatus('in_talks')).toBe(true);
    expect(isEnquiryStatus('read')).toBe(false);
  });
});
