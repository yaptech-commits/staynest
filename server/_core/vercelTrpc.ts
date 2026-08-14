import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";

const app = express();

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(
  createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
      console.error(`[tRPC Error] on path '${path}':`, error);
    },
  })
);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[Vercel Function Error Uncaught]:", err);
  res.status(500).json({
    error: err?.message || "Internal server error",
    stack: process.env.NODE_ENV === "development" ? err?.stack : undefined,
  });
});

export default async function handler(req: any, res: any) {
  if (!req.body && (req.method === "POST" || req.method === "PUT")) {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }
    try {
      if (body) {
        req.body = JSON.parse(body);
      }
    } catch (e) {
      // ignore parse error
    }
  }
  return app(req, res);
}
