import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Vercel invokes this catch-all function for every /api/trpc/* request.
// Mounting the same tRPC middleware used by the local Express server keeps
// procedure paths, cookies, batching, and SuperJSON behavior consistent.
app.use(
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

export default app;
