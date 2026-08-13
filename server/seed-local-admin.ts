import crypto from "crypto";
import { createOrUpdateLocalUser } from "./db";

async function seed() {
  const passwordHash = crypto.createHash("sha256").update("Gist_zone@blogger1").digest("hex");
  const user = await createOrUpdateLocalUser({
    email: "wisdomasaare41@gmail.com",
    name: "Wisdom Asaare",
    passwordHash,
    role: "admin",
  });
  console.log("Seeded local admin user:", user?.email, "Role:", user?.role);
}

seed().catch(console.error);
