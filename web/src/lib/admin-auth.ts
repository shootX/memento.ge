import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  if (hash && hash.startsWith("$2")) {
    return bcrypt.compare(password, hash);
  }

  const plain = process.env.ADMIN_PASSWORD;
  if (!plain) return false;

  if (process.env.NODE_ENV === "production") {
    return false;
  }

  const a = Buffer.from(password);
  const b = Buffer.from(plain);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function adminPasswordHashForSeed(plain: string): string {
  return bcrypt.hashSync(plain, 12);
}
