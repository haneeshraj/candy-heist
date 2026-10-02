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

The store's database test is opt-in, against a server you don't mind a
scratch database on (it drops it after):

```bash
TEST_MONGODB_URI=mongodb://127.0.0.1:27017 npx vitest run store.integration
```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
