import { prisma } from "../src/lib/prisma";

async function main() {
  const email = "partner@memento.demo";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Demo Studio", role: "partner", emailVerified: new Date() },
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
      },
    });
  }
  await prisma.partnerMember.upsert({
    where: { partnerId_userId: { partnerId: org.id, userId: user.id } },
    create: { partnerId: org.id, userId: user.id, role: "owner" },
    update: {},
  });
  const event = await prisma.event.findFirst({ where: { guestSlug: "A8m__4geAw41Wd17eKMrc" } });
  if (event) {
    await prisma.event.update({
      where: { id: event.id },
      data: {
        partnerOrgId: org.id,
        disposableEnabled: true,
        shotsPerGuest: 5,
      },
    });
  }
  console.log("Partner demo ready. Login:", email, "(use magic link in dev)");
}

main().then(() => prisma.$disconnect());
