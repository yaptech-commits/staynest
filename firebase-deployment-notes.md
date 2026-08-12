# Firebase deployment notes

- Firebase project created in the authenticated account: `staynest-e7dba`.
- Firebase Hosting site exists with default domains: `staynest-e7dba.web.app` and `staynest-e7dba.firebaseapp.com`.
- Hosting setup guide is complete through the CLI initialization step; the remaining action is `firebase deploy` from the built app directory.
- Firebase Cloud Shell opens from the Hosting dashboard but requests explicit Google Cloud API authorization each time a new session is created.
- The latest authorization click redirected to a Google authorization page and is still being monitored.
- The StayNest source repository is already available at `https://github.com/yaptech-commits/staynest` and Vercel is live at `https://staynest-yaptech.vercel.app`.

- Firebase CLI requires device login because the Cloud Shell authentication did not persist to the local sandbox environment.
- The `firebase login --no-localhost` command is currently running and awaiting telemetry approval before providing the authorization URL.
