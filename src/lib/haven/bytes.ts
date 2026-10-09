import 'server-only';
import { havenJson } from './guard';

// A request body of raw bytes, an image Candy Haven sends: a release's
// cover, a service's photo.

/** The types it may be, and how large. */
export interface BytesBody {
  types: readonly string[];
  /** In bytes. */
  limit: number;
}

const tooLarge = () => havenJson({ error: 'too_large' }, 413);

/**
 * The body's bytes, or the answer to give instead: the wrong type, or
 * more than the limit. A length said up front is believed for refusing;
 * otherwise (or when it's wrong) the body is counted as it comes.
 */
export async function readBytes(
  request: Request,
  { types, limit }: BytesBody
): Promise<Buffer | Response> {
  const type = (request.headers.get('content-type') ?? '')
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (!types.includes(type))
    return havenJson({ error: 'unsupported_type' }, 415);
  if (Number(request.headers.get('content-length')) > limit) return tooLarge();
  if (!request.body) return Buffer.alloc(0);

  const chunks: Uint8Array[] = [];
  let size = 0;
  const reader = request.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return tooLarge();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
