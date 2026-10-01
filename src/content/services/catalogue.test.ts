import { describe, expect, it } from 'vitest';
import catalogueData from './catalogue.json';
import {
  catalogueSchema,
  commissions,
  findItem,
  itemsOf,
  sessions
} from './catalogue';

describe('services catalogue', () => {
  it('splits commissions from sessions, each with its kind', () => {
    expect(commissions.map((item) => item.id)).toEqual([
      'mixing',
      'mastering',
      'mixing-and-mastering',
      'beat-production'
    ]);
    expect(sessions.map((item) => item.id)).toEqual([
      'production-session',
      'dj-lessons'
    ]);
    expect(commissions.every((item) => item.kind === 'commission')).toBe(true);
    expect(itemsOf('session')).toBe(sessions);
  });

  it('reads each write-up from markdown into blocks', () => {
    const blocks = findItem('production-session')!.blocks;
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect(blocks).toContainEqual({ kind: 'heading', text: 'What’s included' });
    // "**0′**: Listen through…" items read as a term and its text.
    expect(blocks.find((block) => block.kind === 'entries')).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ term: '0′' })])
    });
  });

  it('gives every session a length for its calendar invite', () => {
    expect(sessions.every((item) => item.durationMinutes! > 0)).toBe(true);
  });

  it('refuses two services with the same id', () => {
    const broken = {
      ...catalogueData,
      sessions: [
        { ...catalogueData.sessions[0], id: catalogueData.commissions[0].id }
      ]
    };
    expect(catalogueSchema.safeParse(broken).success).toBe(false);
  });

  it('finds an item by id, and nothing for an unknown one', () => {
    expect(findItem('dj-lessons')?.name).toBe('DJ Lessons');
    expect(findItem('trumpet')).toBeUndefined();
    expect(findItem(null)).toBeUndefined();
  });
});
