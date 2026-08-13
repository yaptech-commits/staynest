import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { registerBillFlowRoutes } from "../billflow-api";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerBillFlowRoutes(app);

  // Scheduled check-in reminder cron callback
  app.post("/api/scheduled/checkInReminders", async (req, res) => {
    try {
      const { sdk } = await import("./sdk");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron) {
        return res.status(403).json({ error: "Cron only" });
      }
      const { getAllBookings } = await import("../db");
      const { sendCheckInReminderEmail, sendSmsReminder } = await import("../staynest");
      const allBookings = await getAllBookings();
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = allBookings.filter((b) => b.paymentStatus === "success" && b.checkInDate === today && b.bookingStatus === "booked");
      let sentCount = 0;
      for (const booking of upcoming) {
        if (booking.guestEmail) {
          await sendCheckInReminderEmail({
            to: booking.guestEmail,
            guestName: booking.guestName,
            bookingReference: booking.bookingReference,
            hotelName: booking.hotelId === 1 ? "The Gold Coast House" : booking.hotelId === 3 ? "Ada Palm Retreat" : "Cantonments House",
            checkInDate: booking.checkInDate,
            checkOutDate: booking.checkOutDate,
          });
          sentCount++;
        }
        if (booking.guestPhone) {
          await sendSmsReminder({
            phone: booking.guestPhone,
            message: `StayNest Reminder: Your stay at ${booking.hotelId === 1 ? "The Gold Coast House" : "Cantonments House"} begins today (${booking.checkInDate}). Ref: ${booking.bookingReference}`,
          });
        }
      }
      return res.json({ ok: true, processed: upcoming.length, sentCount });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || "Internal error", stack: error?.stack });
    }
  });

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
