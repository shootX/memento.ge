import { prisma } from "../src/lib/prisma";
import { createUserSession } from "../src/lib/user-session";

const PARTNER_EMAIL = "partner@memento.demo";

async function main() {
  let user = await prisma.user.findUnique({ where: { email: PARTNER_EMAIL } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: PARTNER_EMAIL,
        name: "Demo Photo Studio",
        role: "partner",
        emailVerified: new Date(),
      },
    });
  }
  let org = await prisma.partnerOrg.findUnique({ where: { slug: "demo-studio" } });
  if (!org) {
    org = await prisma.partnerOrg.create({
      data: {
        name: "Demo Photo Studio",
        slug: "demo-studio",
        primaryColor: "#5c7a62",
        secondaryColor: "#c4a574",
        creditsBalance: 12,
        whiteLabel: true,
        commissionRate: 0.15,
      },
    });
  }
  await prisma.partnerMember.upsert({
    where: { partnerId_userId: { partnerId: org.id, userId: user.id } },
    create: { partnerId: org.id, userId: user.id, role: "owner" },
    update: {},
  });
  const token = await createUserSession(user.id);
  process.stdout.write(token);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
