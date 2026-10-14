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

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## ArtistConnect UI preview

The home page includes Discover (Search for Artist), Make a post, and Create event.
Run `npm install` and `npm run dev` from `frontend`, then open http://localhost:3000.

- Search defaults to a sample directory. Select **Live backend** to query `/api/artists/search` on http://localhost:8080. Set `NEXT_PUBLIC_API_URL` to override that origin. The backend must allow the frontend origin through CORS.
- Posts support text and up to five image/audio/video attachments (2 MB each), public/private visibility, and comment permissions. Saved posts appear immediately in the demo artist profile.
- Events support physical/virtual locations, future dates, capacity, multiple USD ticket tiers, editable drafts, and submission as Pending Approval.
- This is a UI preview with a fixed demo artist account. Posts, events, follows, conversations, and booking requests persist in browser localStorage (`artistconnect-ui-v1`). Storage failures are surfaced without clearing form input. No real messages, admin queue entries, approvals, or notifications are produced. Authentication, media storage, and backend mutation integration remain necessary for production.

Manual checks: empty post and empty search errors; name/genre/location combinations; no search results; search pagination; reopening an existing chat; attachment removal; post permissions after reload; event field errors; free and paid tiers; draft reload/edit; pending event confirmation; keyboard navigation and Escape in artist profiles; mobile layouts.
