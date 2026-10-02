import { describe, expect, it } from 'vitest';
import {
  changesSchema,
  isVisible,
  releasePatchSchema,
  releaseSchema,
  shelfSchema,
  spotifyAlbumId,
  titleKey
} from './model';

const release = (patch: object = {}) => ({
  title: 'Menace',
  kind: 'single',
  status: 'released',
  artist: 'Candy Heist',
  date: '2025-03-14',
  subtitle: '',
  label: '',
  credits: [],
  tracks: [{ title: 'Menace', duration: '3:37', isrc: 'qzes82500001' }],
  distribution: [],
  upc: '',
  ...patch
});

describe('a release sent from Haven', () => {
  it('reads a whole release, dropping empty optional fields', () => {
    const parsed = releaseSchema.parse(release());
    expect(parsed.subtitle).toBeUndefined();
    expect(parsed.label).toBeUndefined();
    expect(parsed.tracks[0].isrc).toBe('QZES82500001');
  });

  it('needs a track, and exactly one for a single or a remix', () => {
    expect(releaseSchema.safeParse(release({ tracks: [] })).success).toBe(
      false
    );
    const two = [{ title: 'A' }, { title: 'B' }];
    expect(
      releaseSchema.safeParse(release({ kind: 'remix', tracks: two })).success
    ).toBe(false);
    expect(
      releaseSchema.safeParse(release({ kind: 'ep', tracks: two })).success
    ).toBe(true);
  });

  it('keeps a track that is still to be named', () => {
    const parsed = releaseSchema.parse(
      release({ kind: 'ep', tracks: [{ title: 'Menace' }, { title: '' }] })
    );
    expect(parsed.tracks[1].title).toBe('');
  });

  it('refuses a UPC or an ISRC that isn’t one', () => {
    expect(releaseSchema.safeParse(release({ upc: '12ab' })).success).toBe(
      false
    );
    expect(
      releaseSchema.safeParse(release({ tracks: [{ title: 'A', isrc: 'X1' }] }))
        .success
    ).toBe(false);
    expect(
      releaseSchema.safeParse(release({ upc: '199350000000' })).success
    ).toBe(true);
  });

  it('needs a link on every platform it lists', () => {
    const bare = { platform: 'spotify' };
    expect(
      releaseSchema.safeParse(release({ distribution: [bare] })).success
    ).toBe(false);
  });

  it('takes a change of any one field, and refuses an empty one', () => {
    expect(
      releasePatchSchema.safeParse({ title: 'Menace (VIP)' }).success
    ).toBe(true);
    expect(releasePatchSchema.safeParse({}).success).toBe(false);
  });
});

describe('recognising a release', () => {
  it('finds the Spotify album in its links', () => {
    expect(
      spotifyAlbumId([
        { platform: 'deezer', streamUrl: 'https://www.deezer.com/album/1' },
        {
          platform: 'spotify',
          streamUrl:
            'https://open.spotify.com/intl-de/album/4aawyAB9vmqN3uQ7FjRGTy?si=x'
        }
      ])
    ).toBe('4aawyAB9vmqN3uQ7FjRGTy');
    expect(
      spotifyAlbumId([
        { platform: 'spotify', streamUrl: 'https://open.spotify.com/track/1' }
      ])
    ).toBe('');
  });

  it('keys a title by its words and its kind', () => {
    expect(titleKey('Move Yo Body!', 'single')).toBe('move-yo-body|single');
    expect(titleKey('MOVE YO BODY', 'single')).toBe('move-yo-body|single');
    expect(titleKey('Move Yo Body!', 'ep')).not.toBe(
      titleKey('Move Yo Body!', 'single')
    );
  });
});

describe('who sees a release', () => {
  const on = '2026-10-02';
  const r = (
    shown: boolean | null,
    status: 'draft' | 'scheduled' | 'released',
    date: string | null = null
  ) => ({ shown, status, date });

  it('shows what’s out or announced, and keeps a draft back', () => {
    expect(isVisible(r(null, 'released'), on)).toBe(true);
    expect(isVisible(r(null, 'scheduled', '2026-10-23'), on)).toBe(true);
    // Scheduled for no day: nothing to announce, so it waits like a draft.
    expect(isVisible(r(null, 'scheduled'), on)).toBe(false);
    expect(isVisible(r(null, 'draft'), on)).toBe(false);
    expect(isVisible(r(null, 'draft', '2026-10-23'), on)).toBe(false);
  });

  it('keeps a release hidden by hand hidden, even once it’s out', () => {
    expect(isVisible(r(false, 'released'), on)).toBe(false);
    expect(isVisible(r(false, 'scheduled', '2026-10-23'), on)).toBe(false);
    expect(isVisible(r(false, 'draft', '2026-10-01'), on)).toBe(false);
  });

  it('takes shown as only “not hidden”: a draft stays back', () => {
    expect(isVisible(r(true, 'draft'), on)).toBe(false);
    expect(isVisible(r(true, 'draft', '2026-10-23'), on)).toBe(false);
    expect(isVisible(r(true, 'scheduled', '2026-10-23'), on)).toBe(true);
  });

  it('shows a draft on its day, even if its status was never moved', () => {
    const draft = r(null, 'draft', '2026-10-02');
    expect(isVisible(draft, '2026-10-01')).toBe(false);
    expect(isVisible(draft, '2026-10-02')).toBe(true);
    expect(isVisible(draft, '2026-10-03')).toBe(true);
  });

  it('holds up to eight on the shelf, each once', () => {
    const id = (n: number) => n.toString(16).padStart(24, '0');
    expect(
      shelfSchema.safeParse({ ids: [1, 2, 3, 4, 5, 6, 7, 8].map(id) }).success
    ).toBe(true);
    expect(
      shelfSchema.safeParse({ ids: [1, 2, 3, 4, 5, 6, 7, 8, 9].map(id) })
        .success
    ).toBe(false);
    expect(shelfSchema.safeParse({ ids: [id(1), id(1)] }).success).toBe(false);
  });
});

describe('several changes in one request', () => {
  const ID = '6650f0f0f0f0f0f0f0f0f0f0';
  const OTHER = '6650f0f0f0f0f0f0f0f0f0f1';

  it('needs something to change, and an empty shelf is something', () => {
    expect(changesSchema.safeParse({}).success).toBe(false);
    expect(changesSchema.safeParse({ update: [], add: [] }).success).toBe(
      false
    );
    const cleared = changesSchema.parse({ shelf: [] });
    expect(cleared).toEqual({ add: [], update: [], visibility: [], shelf: [] });
    // Left out, the shelf stays as it is.
    expect(
      changesSchema.parse({ visibility: [{ id: ID, shown: false }] }).shelf
    ).toBeUndefined();
  });

  it('names a release once in each list, but in more than one list', () => {
    const update = { id: ID, fields: { label: 'Self-released' } };
    expect(
      changesSchema.safeParse({
        update: [update],
        visibility: [{ id: ID, shown: false }],
        shelf: [ID]
      }).success
    ).toBe(true);
    expect(changesSchema.safeParse({ update: [update, update] }).success).toBe(
      false
    );
    expect(
      changesSchema.safeParse({
        visibility: [
          { id: ID, shown: true },
          { id: ID.toUpperCase(), shown: null }
        ]
      }).success
    ).toBe(false);
    expect(changesSchema.safeParse({ shelf: [ID, OTHER, ID] }).success).toBe(
      false
    );
  });

  it('checks each part as its own request would', () => {
    expect(
      changesSchema.safeParse({ update: [{ id: ID, fields: {} }] }).success
    ).toBe(false);
    expect(
      changesSchema.safeParse({ add: [{ ref: 'a', fields: release() }] })
        .success
    ).toBe(true);
    expect(
      changesSchema.safeParse({
        add: [{ ref: 'a', fields: release({ tracks: [] }) }]
      }).success
    ).toBe(false);
    expect(
      changesSchema.safeParse({ visibility: [{ id: 'nope', shown: false }] })
        .success
    ).toBe(false);
  });
});
