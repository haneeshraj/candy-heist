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
(`/api/haven/*`); bookings and their payments go there too (see Bookings
and payments, below). Copy `.env.example` to `.env.local` and fill it in;
the same names go in Vercel's environment variables for the live site.

| Name                                 | What it is                                                         |
| ------------------------------------ | ------------------------------------------------------------------ |
| `MONGODB_URI`                        | Atlas connection string (`heist-dev` here, `heist-prod` live)      |
| `MONGODB_DB`                         | `candy_heist_dev` here, `candy_heist_prod` live                    |
| `FIREBASE_PROJECT_ID`                | The Firebase project Candy Haven signs in to                       |
| `HAVEN_ALLOWED_UIDS`                 | The two Firebase account ids allowed into the API, comma-separated |
| `NEXT_PUBLIC_SUPABASE_URL`           | The Supabase project release covers are stored in                  |
| `SUPABASE_SECRET_KEY`                | Its secret key (`sb_secret_...`), server only                      |
| `SUPABASE_COVERS_BUCKET`             | `covers-dev` here, `covers` live (`covers-dev` when missing)       |
| `STRIPE_SECRET_KEY`                  | Stripe's secret key: `sk_test_...` here, `sk_live_...` live        |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Its publishable key, `pk_test_...` / `pk_live_...`                 |
| `STRIPE_WEBHOOK_SECRET`              | The webhook's signing secret, `whsec_...`                          |
| `GOOGLE_CLIENT_ID`                   | The OAuth client Candy's Google account is connected through       |
| `GOOGLE_CLIENT_SECRET`               | Its secret                                                         |
| `GOOGLE_CONNECT_KEY`                 | 32 random bytes, hex: the key to `/api/google/connect`             |
| `GOOGLE_TOKEN_KEY`                   | 32 random bytes, base64: seals Candy's sign-in in the database     |
| `BOOKING_NOTIFY_EMAIL`               | Optional: where Candy's booking notes go (his Gmail when unset)    |

Without them the site still runs; the two forms say they couldn't send,
the API answers that it isn't configured, and every release shows the
placeholder cover. Without Stripe, the payment step says payment isn't
open yet; without Google, open times come from Candy's hours and the
bookings alone, and nothing is put on a calendar or emailed.

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

## Services from Candy Haven

What "Book me as a music producer" offers, and when sessions can be
booked, come from Candy Haven's SERVICES department through the same API
(`/api/haven/services*`). Haven keeps its list on the machine it's edited
on and publishes all of it at once, with the hours; the database here
keeps the last publish (`services_published`, one document). Until Haven
publishes, the site offers its own `src/content/services/catalogue.json`
and `hours.json`; from then on, only Haven's, refreshed on each publish
rather than read per visit (`getServices`). The home page's Sessions list
stays in `src/content/home/sessions.json`, by each service's address: a
service that's no longer offered drops off it, and off its testimonials.

- `GET /api/haven/services`: what the site offers now, with its revision (0 before the first publish).
- `PUT /api/haven/services`: `{ items, hours, baseRevision, force }`, the whole list in order and the hours. A publish over a newer revision answers 409 with what's there, unless `force`.
- `PUT /api/haven/services/photo`: one image as the body (PNG, JPEG or WebP, at least 1200×800); the site cuts the card (700×1000) and the banner (1600×609) from it, around what draws the eye, and answers with both addresses. They're kept in the covers bucket, under `services/`. A service may only show those, or the site's own photos under `/img/`.

How long a time is held while someone pays stays the site's
(`hours.json`'s `holdMinutes`).

## Bookings and payments

"Book me as a music producer" (`/services/producer`) and "Pay an
invoice" (`/services/pay`) take real payments, through Stripe, in CAD.

- **Prices** are each service's price, set in Haven (before its first
  publish, `price` in `src/content/services/catalogue.json`), in dollars.
  A service without one can't be paid for online; its payment step says so.
- **Open times** are Candy's start times per weekday, in his zone, set in
  Haven with his days off, the notice, how far ahead, and a break between
  sessions (before its first publish, `src/content/services/hours.json`).
  Anything busy on his Google Calendar, and any session booked or being
  paid for, shows as taken. Visitors see times in their own time zone.
  `/api/booking/slots` serves them a month at a time.
- **Paying** opens a Stripe payment on the server for what's due now (a
  session in full, half a commission), Stripe's card fields take the
  card, and the server checks with Stripe before booking it.
- **Once paid**, a session goes on Candy's calendar with a Google Meet
  link and the client invited, a commission gets its second-half invoice
  (`CH-XXXXXX-2`, paid on `/services/pay`), and the client's receipt and
  Candy's note go out from his Gmail. `/api/stripe/webhook` does the same
  if the visitor's tab closes before the page finishes; each step is done
  once.

Stored in `bookings`, `invoices` and `google_account` (Candy's sign-in,
sealed with `GOOGLE_TOKEN_KEY`).

Candy Haven's SERVICES shows every paid booking (its PRODUCER tab), and
can move or cancel a session:

- `GET /api/haven/bookings?since=`: every paid or cancelled booking changed since then, each with its invoice, Meet link and payment in Stripe, by `updatedAt`; pass back the answer's `cursor`.
- `POST /api/haven/bookings/<ref>/move`: `{ start, force }`. Never onto another booking; onto something on Candy's calendar only with `force`. The old time opens up, the event moves (Google sends the client the updated invitation), and the client gets an email with the new time and the old.
- `POST /api/haven/bookings/<ref>/cancel`: `{ note }`, for a session still to come. Its time opens up, its event comes off the calendar, and the client gets an email with the note. Any refund is made in Stripe, by hand.

Without Google connected, both still change the booking, and say that
nobody was told.

### Stripe

1. In the Stripe dashboard, in test mode, copy the publishable and secret
   keys into `.env.local`.
2. Add a webhook endpoint for `https://<site>/api/stripe/webhook`, sending
   `payment_intent.succeeded`, and copy its signing secret. Locally,
   `stripe listen --forward-to localhost:3000/api/stripe/webhook` prints
   one to use instead.
3. Test with card `4242 4242 4242 4242`, any future expiry and any CVC;
   `4000 0025 0000 3155` asks for 3-D Secure, `4000 0000 0000 9995` is
   declined.

Live keys go in only on the live site, once Candy's Stripe account is
activated.

### Candy's Google account

1. In the Google Cloud console (the Firebase project works), enable the
   Google Calendar API and the Gmail API.
2. OAuth consent screen: External, then **Publish app** to put it in
   production. Left in testing, the sign-in stops working after 7 days.
   It isn't verified, so Google shows a warning on the sign-in page;
   that's fine for one account (Advanced, then continue).
3. Credentials: an OAuth client of type Web application, with these
   redirect URIs: `http://localhost:3000/api/google/callback` and
   `https://<site>/api/google/callback`. Copy its id and secret.
4. Make the two keys and set all four variables:
   `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   for `GOOGLE_TOKEN_KEY`, and
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   for `GOOGLE_CONNECT_KEY`. That one goes in a link, where base64's `+`
   and `/` don't come through whole, so it's hex.
5. Candy opens `https://<site>/api/google/connect?key=<GOOGLE_CONNECT_KEY>`,
   signs in and allows everything asked for: seeing when he's free or
   busy (not what his events are), adding events to his calendar, and
   sending email as him. The page then says which account is connected.
   Connecting again replaces it.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
