# Chess Arena (demo)

1. Install Node.js (v18+), then run `npm install`.
2. In Firebase console: create a project, add a Web app, enable Authentication > Google, and create a Firestore database.
3. Copy `.env.example` to `.env` and paste the 6 values from your Web app.
4. Paste `firestore.rules` into Firestore > Rules and publish (includes the online play rules).
5. Run `npm run dev`. To deploy: `npm run build`, then `firebase deploy` (or upload `dist/` to Vercel/Netlify).

Add your site's domain under Authentication > Settings > Authorized domains.
