#!/usr/bin/env npx tsx
/**
 * Emergency: revoke all outstanding magic-link tokens and user sessions.
 * Run on production after a magic-link exposure incident:
 *   npx tsx scripts/invalidate-auth-tokens.ts
 */
import { prisma } from "../src/lib/prisma";

async function main() {
  const [magic, sessions] = await prisma.$transaction([
    prisma.magicLinkToken.deleteMany({}),
    prisma.session.deleteMany({}),
  ]);
  console.info(`Deleted magicLinkToken: ${magic.count}, session: ${sessions.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
