import { admitHaven, havenFailure, havenJson } from '@/lib/haven/guard';
import { loreSnapshot } from '@/lib/lore/store';

// Candy Haven's LORE editor, opening or checking for new: every chapter
// published, in its order, and whether the site shows them yet.
export async function GET(request: Request) {
  const admitted = await admitHaven(request);
  if ('response' in admitted) return admitted.response;
  try {
    return havenJson(await loreSnapshot());
  } catch (error) {
    return havenFailure(error);
  }
}
