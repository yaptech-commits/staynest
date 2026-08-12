# StayNest deployment verification

The private GitHub repository is `https://github.com/yaptech-commits/staynest` and the verified repository visibility is private. The production Vercel project is `staynest` under the `yaptech` team, with domains `https://staynest-yaptech.vercel.app` and `https://staynest-alpha-nine.vercel.app`. Its latest deployment is `READY` and the Vercel build logs show that Vite and the Express server bundle both completed successfully. The direct unauthenticated HTTP probe currently receives a Vercel SSO redirect, so the public URL is protected by deployment authentication and end-to-end API behavior has not been externally verified.

Firebase project `staynest-e7dba` has Hosting deployed at `https://staynest-e7dba.web.app` and `https://staynest-e7dba.firebaseapp.com`. The Firebase deployment completed successfully and the public home page renders after the initial load. Firebase Hosting contains only the static Vite output under `dist/public`; it does not host the Express/tRPC backend, BillFlow endpoints, payment verification, auth callbacks, or booking APIs. A Firebase App Hosting, Cloud Run, or Functions backend deployment is still required for full-stack parity.

The Firebase Hosting configuration is documented in `firebase.json` and `.firebaserc`, with SPA fallback rewrites and the `staynest-e7dba` site target.
