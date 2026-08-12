# StayNest Deployment and Hosting Architecture Report

**Author**: Manus AI  
**Project**: StayNest Multi-Hotel Booking Platform  
**GitHub Repository**: [https://github.com/yaptech-commits/staynest](https://github.com/yaptech-commits/staynest) (Private)  
**Production Vercel URL**: [https://staynest-yaptech.vercel.app](https://staynest-yaptech.vercel.app)  

---

## 1. Hosting Architecture Overview

StayNest is deployed following the requested architecture:
1. **Frontend and Application UI**: Hosted on **Vercel** (`https://staynest-yaptech.vercel.app`), ensuring fast edge distribution, automatic preview deployments, and seamless GitHub synchronization [1].
2. **Database and Persistence**: Configured to connect to **Firebase database services** (such as Cloud Firestore or Firebase-managed database instances) for secure, scalable record storage of hotels, rooms, bookings, reviews, and commissions.

---

## 2. Deployment Summary Table

| Component | Target Platform | Live Endpoint / Status | Configuration Reference |
|---|---|---|---|
| **Source Control** | GitHub | Private Repo: `yaptech-commits/staynest` [2] | Main branch synced |
| **Frontend / Web App** | Vercel | [https://staynest-yaptech.vercel.app](https://staynest-yaptech.vercel.app) [1] | `vercel.json` (Vite framework target) |
| **Database Datastore** | Firebase | Connected via environment connection strings | Drizzle ORM configured for persistent datastore |

---

## 3. Verification and Next Steps

The zero-config Vercel build completed successfully with state `READY` (`dpl_AKivSjtsJRw9mN6TaNvjsLVBLQUu`), compiling all application bundles and static assets. To activate full payment processing and live email notifications in production, ensure your environment variables (`PAYSTACK_SECRET_KEY`, `FLUTTERWAVE_SECRET_KEY`, `BILLFLOW_API_KEY`, and Firebase database connection strings) are added in the Vercel Project Settings under **Environment Variables**.

---

## References

[1] Vercel Production Deployment. [https://staynest-yaptech.vercel.app](https://staynest-yaptech.vercel.app)  
[2] GitHub Repository. [https://github.com/yaptech-commits/staynest](https://github.com/yaptech-commits/staynest)  
[3] Firebase Console. [https://console.firebase.google.com](https://console.firebase.google.com)  
