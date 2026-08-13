import { drizzle } from "drizzle-orm/mysql2";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

async function seedAdmin() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set");
    process.exit(1);
  }
  const db = drizzle(process.env.DATABASE_URL);
  const email = "wisdomasaare41@gmail.com";
  const openId = "wisdom-admin-explicit";

  console.log(`Upserting admin user for ${email}...`);
  try {
    await db.insert(users).values({
      openId,
      name: "Wisdom Asaare",
      email,
      loginMethod: "oauth",
      role: "admin",
      lastSignedIn: new Date(),
    }).onDuplicateKeyUpdate({
      set: {
        role: "admin",
        name: "Wisdom Asaare",
      },
    });
    console.log("Successfully seeded admin user wisdomasaare41@gmail.com with admin role.");
  } catch (err) {
    console.error("Failed to seed admin user:", err);
    process.exit(1);
  }
}

seedAdmin();
