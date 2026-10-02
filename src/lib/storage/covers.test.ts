// @vitest-environment node
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  COVER_MAX_BYTES,
  COVER_SIZE,
  DEFAULT_COVERS_BUCKET,
  encodeCover,
  InvalidCoverError,
  readCoversConfig,
  removeCover,
  uploadCover
} from './covers';

// Covers as the site makes and stores them, with Supabase stood in for:
// nothing here reaches the network.

const upload = vi.fn();
const remove = vi.fn();
const from = vi.fn();
vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }));

const PROJECT = 'https://project.supabase.test';
const RELEASE = '6650f0f0f0f0f0f0f0f0f0f0';

/** A noisy square PNG, like artwork rather than a flat colour, with EXIF to strip. */
const png = (side: number) =>
  sharp({
    create: {
      width: side,
      height: side,
      channels: 3,
      background: '#b1272b',
      noise: { type: 'gaussian', mean: 128, sigma: 40 }
    }
  })
    .withExif({ IFD0: { Copyright: 'Candy Heist', Artist: 'Candy Heist' } })
    .png({ compressionLevel: 1 })
    .toBuffer();

describe('where covers are stored', () => {
  it('needs the project and its secret key', () => {
    expect(readCoversConfig({})).toBeNull();
    expect(readCoversConfig({ NEXT_PUBLIC_SUPABASE_URL: PROJECT })).toBeNull();
    expect(readCoversConfig({ SUPABASE_SECRET_KEY: 'sb_secret_x' })).toBeNull();
  });

  it('uses the development bucket unless told otherwise, never the live one by accident', () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: PROJECT,
      SUPABASE_SECRET_KEY: 'sb_secret_x'
    };
    expect(DEFAULT_COVERS_BUCKET).toBe('covers-dev');
    expect(readCoversConfig(env)?.bucket).toBe('covers-dev');
    expect(
      readCoversConfig({ ...env, SUPABASE_COVERS_BUCKET: '  ' })?.bucket
    ).toBe('covers-dev');
    expect(
      readCoversConfig({ ...env, SUPABASE_COVERS_BUCKET: 'covers' })?.bucket
    ).toBe('covers');
  });
});

describe('a cover as the site makes it', () => {
  let large: Buffer;
  beforeAll(async () => {
    large = await png(3000);
  });

  it('makes a 750×750 WebP under 1 MB, with nothing kept but its pixels', async () => {
    const cover = await encodeCover(large);
    expect(cover.bytes).toBe(cover.data.length);
    expect(cover.bytes).toBeLessThan(COVER_MAX_BYTES);
    expect([cover.width, cover.height]).toEqual([COVER_SIZE, COVER_SIZE]);

    const meta = await sharp(cover.data).metadata();
    expect(meta.format).toBe('webp');
    expect([meta.width, meta.height]).toEqual([750, 750]);
    expect(meta.exif).toBeUndefined();
    expect(meta.xmp).toBeUndefined();
    expect(meta.iptc).toBeUndefined();
  });

  it('turns a photo the way its camera said', async () => {
    // Stored 800 wide and 400 tall, to be shown turned a quarter: the
    // square is cut from the middle either way, so the colour says which.
    const half = (colour: string) =>
      sharp({
        create: { width: 400, height: 400, channels: 3, background: colour }
      })
        .png()
        .toBuffer();
    const sideways = await sharp({
      create: { width: 800, height: 400, channels: 3, background: '#000' }
    })
      .composite([
        { input: await half('#ff0000'), left: 0, top: 0 },
        { input: await half('#0000ff'), left: 400, top: 0 }
      ])
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    expect((await sharp(sideways).metadata()).orientation).toBe(6);

    const cover = await encodeCover(sideways);
    const { data } = await sharp(cover.data)
      .extract({ left: 700, top: 50, width: 1, height: 1 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    // Turned clockwise, the red half that was on the left is now the top
    // (unturned, the top right would be blue).
    expect(data[0]).toBeGreaterThan(200);
    expect(data[2]).toBeLessThan(60);
  });

  it('refuses what isn’t an image, and one too small to make a cover of', async () => {
    await expect(encodeCover(Buffer.from('not an image'))).rejects.toThrow(
      InvalidCoverError
    );
    await expect(encodeCover(await png(299))).rejects.toThrow(
      'at least 300×300 pixels; that one is 299×299'
    );
    const gif = await sharp({
      create: { width: 400, height: 400, channels: 3, background: '#000' }
    })
      .gif()
      .toBuffer();
    await expect(encodeCover(gif)).rejects.toThrow('a PNG, a JPEG or a WebP');
  });
});

describe('a cover in storage', () => {
  beforeAll(() => {
    vi.mocked(createClient).mockReturnValue({
      storage: { from }
    } as unknown as ReturnType<typeof createClient>);
    from.mockReturnValue({
      upload,
      remove,
      getPublicUrl: (path: string) => ({
        data: { publicUrl: `${PROJECT}/storage/v1/object/public/b/${path}` }
      })
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  const configure = (bucket?: string) => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', PROJECT);
    vi.stubEnv('SUPABASE_SECRET_KEY', 'sb_secret_x');
    vi.stubEnv('SUPABASE_COVERS_BUCKET', bucket);
  };

  it('goes in the development bucket, named by its bytes, kept for good', async () => {
    configure();
    upload.mockResolvedValue({ data: {}, error: null });
    const data = Buffer.from('webp bytes');
    const first = await uploadCover(RELEASE, data);
    expect(from).toHaveBeenCalledWith('covers-dev');
    expect(first.path).toMatch(new RegExp(`^${RELEASE}/[0-9a-f]{16}\\.webp$`));
    expect(first.url).toBe(
      `${PROJECT}/storage/v1/object/public/b/${first.path}`
    );
    expect(upload).toHaveBeenCalledWith(first.path, data, {
      upsert: true,
      cacheControl: '31536000',
      contentType: 'image/webp'
    });
    expect(createClient).toHaveBeenCalledWith(PROJECT, 'sb_secret_x', {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // The same bytes, the same name; others, another.
    expect((await uploadCover(RELEASE, data)).path).toBe(first.path);
    expect((await uploadCover(RELEASE, Buffer.from('other'))).path).not.toBe(
      first.path
    );
  });

  it('goes in the bucket it’s told to', async () => {
    configure('covers');
    upload.mockResolvedValue({ data: {}, error: null });
    await uploadCover(RELEASE, Buffer.from('webp bytes'));
    expect(from).toHaveBeenCalledWith('covers');
  });

  it('says when storage refuses it', async () => {
    configure();
    upload.mockResolvedValue({ data: null, error: new Error('refused') });
    await expect(uploadCover(RELEASE, Buffer.from('x'))).rejects.toThrow(
      'refused'
    );
  });

  it('comes out of storage at best: a failure is logged, never thrown', async () => {
    configure();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    remove.mockResolvedValue({ data: [], error: null });
    await removeCover(`${RELEASE}/a.webp`);
    expect(remove).toHaveBeenCalledWith([`${RELEASE}/a.webp`]);

    remove.mockRejectedValue(new Error('offline'));
    await expect(removeCover(`${RELEASE}/b.webp`)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
    vi.mocked(console.error).mockRestore();
  });
});
