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

| Name                  | What it is                                                         |
| --------------------- | ------------------------------------------------------------------ |
| `MONGODB_URI`         | Atlas connection string (`heist-dev` here, `heist-prod` live)      |
| `MONGODB_DB`          | `candy_heist_dev` here, `candy_heist_prod` live                    |
| `FIREBASE_PROJECT_ID` | The Firebase project Candy Haven signs in to                       |
| `HAVEN_ALLOWED_UIDS`  | The two Firebase account ids allowed into the API, comma-separated |

Without them the site still runs; the two forms say they couldn't send,
and the API answers that it isn't configured.

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
(`getCatalogue`). A release that's out shows unless it's hidden; one that
isn't out yet shows only once it's switched on. Each copy of Haven sends
only the fields it changed, and a release from the other copy is
recognised by its UPC, its Spotify album, or its title and kind. Covers
aren't sent yet: every release from Haven shows the placeholder cover and
tape in `public/img/discography`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
