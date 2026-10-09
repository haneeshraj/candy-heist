import { describe, expect, it } from 'vitest';
import catalogueData from './catalogue.json';
import { catalogue, catalogueSchema, fileServices } from './catalogue';

const find = (id: string) => catalogue.find((item) => item.id === id);

describe('the site’s own services', () => {
  it('keeps one list, each item a commission or a 1-1 session', () => {
    expect(catalogue.map((item) => `${item.id}:${item.kind}`)).toEqual([
      'mixing:commission',
      'mastering:commission',
      'mixing-and-mastering:commission',
      'beat-production:commission',
      'production-session:session',
      'dj-lessons:session'
    ]);
  });

  it('reads each write-up from markdown into blocks', () => {
    const blocks = find('production-session')!.blocks;
    expect(blocks[0]).toMatchObject({ kind: 'paragraph' });
    expect(blocks).toContainEqual({ kind: 'heading', text: 'What’s included' });
    // "**0′**: Listen through…" items read as a term and its text.
    expect(blocks.find((block) => block.kind === 'entries')).toMatchObject({
      items: expect.arrayContaining([expect.objectContaining({ term: '0′' })])
    });
  });

  it('keeps the markdown as written too, for Candy Haven to copy in', () => {
    expect(fileServices.map((item) => item.id)).toEqual(
      catalogue.map((item) => item.id)
    );
    expect(fileServices[0].body).toContain('\n');
  });

  it('gives every session a length for its calendar invite', () => {
    const sessions = catalogue.filter((item) => item.kind === 'session');
    expect(sessions.every((item) => item.durationMinutes! > 0)).toBe(true);
  });

  it('refuses a session without a length', () => {
    const [first] = catalogueData.items;
    const broken = { items: [{ ...first, kind: 'session' }] };
    expect(catalogueSchema.safeParse(broken).success).toBe(false);
  });

  it('refuses two services with the same id', () => {
    const [first, second] = catalogueData.items;
    const broken = { items: [first, { ...second, id: first.id }] };
    expect(catalogueSchema.safeParse(broken).success).toBe(false);
  });
});
