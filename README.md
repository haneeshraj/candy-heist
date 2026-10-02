This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment

The contact form and the DJ enquiry form file what visitors send in a
MongoDB Atlas database, which Candy Haven reads through the site's API
(`/api/haven/*`). Copy `.env.example` to `.env.local` and fill it in; the
same names go in Vercel's environment variables for the live site.

| Name                       | What it is                                                         |
| -------------------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`              | Atlas connection string (`heist-dev` here, `heist-prod` live)      |
| `MONGODB_DB`               | `candy_heist_dev` here, `candy_heist_prod` live                    |
| `FIREBASE_PROJECT_ID`      | The Firebase project Candy Haven signs in to                       |
| `HAVEN_ALLOWED_UIDS`       | The two Firebase account ids allowed into the API, comma-separated |
| `NEXT_PUBLIC_SUPABASE_URL` | The Supabase project release covers are stored in                  |
| `SUPABASE_SECRET_KEY`      | Its secret key (`sb_secret_...`), server only                      |
| `SUPABASE_COVERS_BUCKET`   | `covers-dev` here, `covers` live (`covers-dev` when missing)       |

Without them the site still runs; the two forms say they couldn't send,
the API answers that it isn't configured, and every release shows the
placeholder cover.

The stores' database tests are opt-in, against a server you don't mind a
scratch database on (each drops its own after):

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run store.integration
```

## Lore from Candy Haven

The lore is written in Candy Haven's LORE department and published here
through the same API (`/api/haven/lore/*`). Drafts and the planet library
stay in Haven, on the machine they're written on; the database here keeps
only what's published (`lore_published`, `lore_meta`), each chapter with a
copy of its planet. Until Haven publishes its first chapter, `/lore` shows
the markdown files in `src/content/lore/chapters`; from then on it shows
only what Haven has published, refreshed on each publish rather than read
per visit.

Each chapter's planet is data, drawn by the planet engine in
`src/lib/planets` (`engine` for the shapes, `react` for the SVG). Haven
draws its editor's previews with a copy of the same folders, so edit them
here and run Haven's `npm run sync:planets`. In development,
[`/dev/planets`](http://localhost:3000/dev/planets) shows every preset and
layer type.

## Releases from Candy Haven

The discography's releases come from Candy Haven's RELEASES department
through the same API (`/api/haven/releases/*`). The whole catalogue stays
in Haven's DISCOGRAPHY; the database here keeps what RELEASES sends
(`releases_published`, `releases_meta`): each release's public fields,
whether it's shown, and the home page shelf (up to eight, in order).

Until Haven presses "Publish everything", the site shows its own
`src/content/discography/releases.json`; from then on, only Haven's
releases, refreshed on each send rather than read per visit
(`getCatalogue`). Each copy of Haven sends only the fields it changed, and
a release from the other copy is recognised by its UPC, its Spotify album,
or its title and kind. A release without a cover yet shows the placeholder
cover in `public/img/discography`, and the shelf shows the placeholder tape
for every release for now.

A release is a `draft` (not announced), `scheduled` (announced, its day to
come) or `released`. One hidden by hand in RELEASES never shows; otherwise
it shows once it's out (released, or its date has come), and before that
only when it's scheduled, with its pre-save links. A draft waits for its
day. Only releases that show can sit on the shelf.

`POST /api/haven/releases/changes` makes several changes in one request,
all of them or (when one can't be made) none:

- `add`: releases sent for the first time, as `{ ref, fields }`; the answer's `ids` gives the site's id for each ref.
- `update`: `{ id, fields }`, only the fields that changed.
- `visibility`: `{ id, shown }`, where `false` hides it by hand.
- `shelf`: the whole shelf, in order; left out, it stays as it is.

### Covers

Covers live in Supabase Storage, in a public bucket per environment in the
same project: `covers-dev` for development and `covers` for the live site,
each limited to 1 MB and `image/webp`. `SUPABASE_COVERS_BUCKET` names the
bucket (`covers-dev` here, `covers` on Vercel) and falls back to
`covers-dev` when it's missing, so nothing writes to the live covers by
accident. `NEXT_PUBLIC_SUPABASE_URL` is the project; `SUPABASE_SECRET_KEY`
(the `sb_secret_...` key) stays on the server and is never exposed to the
browser. Haven sends each cover already brought down to about 750×750
(lossless PNG, or JPEG or WebP); the site makes the one lossy pass, a
750×750 WebP at quality 82 with its metadata stripped, and stores it as
`<release id>/<hash>.webp`.

- `PUT /api/haven/releases/<id>/cover`: the image itself as the body (`Content-Type: image/png`, `image/jpeg` or `image/webp`, up to 8 MB, at least 300×300); answers with the snapshot, where each release's `cover` is its public URL or `null`.
- `DELETE /api/haven/releases/<id>/cover`: back to the placeholder.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
