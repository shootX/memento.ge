/**
 * Idempotent rich demo dataset for founders / QA.
 * Re-run: npm run seed:full
 */
import { readFile, readdir } from "fs/promises";
import path from "path";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";
import { putObject, buildMediaKey } from "../src/lib/storage";
import { processThumbnail } from "../src/lib/jobs/thumbnails";
import { computeExpiresAt, getPlan } from "../src/lib/plans";
import { ensureDemoEvent } from "./ensure-demo-event";

const SEED_TAG = "seed-full-v1";

const PARTNERS = [
  {
    slug: "lens-tbilisi",
    name: "Lens Studio Tbilisi",
    city: "თბილისი",
    email: "partner.lens@memento.demo",
    userName: "თამარ ლენსი",
    primaryColor: "#c4ff0d",
    secondaryColor: "#5cc8ff",
    credits: 18,
    commissionRate: 0.12,
  },
  {
    slug: "batumi-waves-photo",
    name: "Batumi Waves Photo",
    city: "ბათუმი",
    email: "partner.batumi@memento.demo",
    userName: "ნიკა ზღვისპირა",
    primaryColor: "#0ea5e9",
    secondaryColor: "#34d399",
    credits: 9,
    commissionRate: 0.15,
  },
  {
    slug: "vake-banquet-hall",
    name: "ვაკის ბანკეტური დარბაზი",
    city: "თბილისი",
    email: "partner.banquet@memento.demo",
    userName: "მარიამ ვაკე",
    primaryColor: "#5c7a62",
    secondaryColor: "#c4a574",
    credits: 24,
    commissionRate: 0.1,
  },
] as const;

type EventSeed = {
  guestSlug: string;
  customSlug: string | null;
  hostToken: string;
  slideshowToken: string;
  coupleNames: string;
  eventDate: Date;
  planTier: "starter" | "classic" | "premium";
  isPaid: boolean;
  paidAt: Date | null;
  expiresAt: Date | null;
  partnerSlug?: string;
  disposableEnabled?: boolean;
  shotsPerGuest?: number;
  publicGallery?: boolean;
  galleryPassword?: string;
  moderateUploads?: boolean;
  revealAt?: Date | null;
  mediaCount: number;
  stateLabel: string;
};

const now = new Date();

function daysFromNow(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
}

const EVENTS: EventSeed[] = [
  {
    guestSlug: "memento-demo-guest-01",
    customSlug: "nino-giorgi-demo",
    hostToken: "demo-host-token-memento-2026",
    slideshowToken: "demo-slideshow-token-memento",
    coupleNames: "ნინო & გიორგი",
    eventDate: daysFromNow(14),
    planTier: "classic",
    isPaid: true,
    paidAt: daysFromNow(-30),
    expiresAt: computeExpiresAt(getPlan("classic"), daysFromNow(-30)),
    partnerSlug: "lens-tbilisi",
    disposableEnabled: true,
    shotsPerGuest: 5,
    publicGallery: true,
    mediaCount: 8,
    stateLabel: "upcoming+disposable",
  },
  {
    guestSlug: "seed-live-ketevan-david",
    customSlug: "ketevan-david-live",
    hostToken: "seed-host-live-ketevan-david-2026",
    slideshowToken: "seed-slide-live-ketevan-david",
    coupleNames: "კეთევან & დავით",
    eventDate: daysFromNow(0),
    planTier: "premium",
    isPaid: true,
    paidAt: daysFromNow(-45),
    expiresAt: computeExpiresAt(getPlan("premium"), daysFromNow(-45)),
    partnerSlug: "vake-banquet-hall",
    publicGallery: true,
    moderateUploads: true,
    mediaCount: 14,
    stateLabel: "live",
  },
  {
    guestSlug: "seed-finished-anastasia-luka",
    customSlug: "anastasia-luka-gallery",
    hostToken: "seed-host-finished-anastasia-luka",
    slideshowToken: "seed-slide-finished-anastasia",
    coupleNames: "ანასტასია & ლუკა",
    eventDate: daysFromNow(-120),
    planTier: "classic",
    isPaid: true,
    paidAt: daysFromNow(-150),
    expiresAt: computeExpiresAt(getPlan("classic"), daysFromNow(-150)),
    partnerSlug: "batumi-waves-photo",
    publicGallery: true,
    mediaCount: 12,
    stateLabel: "finished",
  },
  {
    guestSlug: "seed-expired-ela-zurab",
    customSlug: null,
    hostToken: "seed-host-expired-ela-zurab",
    slideshowToken: "seed-slide-expired-ela",
    coupleNames: "ელა & ზურაბ",
    eventDate: daysFromNow(-400),
    planTier: "starter",
    isPaid: true,
    paidAt: daysFromNow(-420),
    expiresAt: daysFromNow(-30),
    publicGallery: false,
    mediaCount: 4,
    stateLabel: "expired",
  },
  {
    guestSlug: "seed-disposable-salome-irakli",
    customSlug: "salome-irakli-disposable",
    hostToken: "seed-host-disposable-salome",
    slideshowToken: "seed-slide-disposable-salome",
    coupleNames: "სალომე & ირაკლი",
    eventDate: daysFromNow(7),
    planTier: "starter",
    isPaid: true,
    paidAt: daysFromNow(-5),
    expiresAt: computeExpiresAt(getPlan("starter"), daysFromNow(-5)),
    disposableEnabled: true,
    shotsPerGuest: 3,
    publicGallery: true,
    mediaCount: 6,
    stateLabel: "disposable",
  },
  {
    guestSlug: "seed-password-mariam-giga",
    customSlug: "mariam-giga-private",
    hostToken: "seed-host-password-mariam",
    slideshowToken: "seed-slide-password-mariam",
    coupleNames: "მარიამ & გიგა",
    eventDate: daysFromNow(21),
    planTier: "premium",
    isPaid: true,
    paidAt: daysFromNow(-10),
    expiresAt: computeExpiresAt(getPlan("premium"), daysFromNow(-10)),
    publicGallery: true,
    galleryPassword: "memento2026",
    mediaCount: 10,
    stateLabel: "password-gallery",
  },
  {
    guestSlug: "seed-unpaid-starter-nika-sopo",
    customSlug: null,
    hostToken: "seed-host-unpaid-nika-sopo",
    slideshowToken: "seed-slide-unpaid-nika",
    coupleNames: "ნიკა & სოფო",
    eventDate: daysFromNow(60),
    planTier: "starter",
    isPaid: false,
    paidAt: null,
    expiresAt: null,
    mediaCount: 0,
    stateLabel: "unpaid",
  },
  {
    guestSlug: "seed-whitelabel-lika-tornike",
    customSlug: "lika-tornike-lens",
    hostToken: "seed-host-whitelabel-lika",
    slideshowToken: "seed-slide-whitelabel-lika",
    coupleNames: "ლიკა & თორნიკე",
    eventDate: daysFromNow(45),
    planTier: "classic",
    isPaid: true,
    paidAt: daysFromNow(-3),
    expiresAt: computeExpiresAt(getPlan("classic"), daysFromNow(-3)),
    partnerSlug: "lens-tbilisi",
    publicGallery: true,
    mediaCount: 9,
    stateLabel: "partner-branded",
  },
  {
    guestSlug: "seed-reveal-batumi-sandro-nino",
    customSlug: "batumi-sandro-nino",
    hostToken: "seed-host-reveal-batumi",
    slideshowToken: "seed-slide-reveal-batumi",
    coupleNames: "სანდრო & ნინო (ბათუმი)",
    eventDate: daysFromNow(10),
    planTier: "classic",
    isPaid: true,
    paidAt: daysFromNow(-7),
    expiresAt: computeExpiresAt(getPlan("classic"), daysFromNow(-7)),
    partnerSlug: "batumi-waves-photo",
    revealAt: daysFromNow(2),
    publicGallery: true,
    mediaCount: 7,
    stateLabel: "reveal-scheduled",
  },
];

const GUEST_NAMES = [
  "მარიამ",
  "ლუკა",
  "ანა",
  "გიორგი",
  "ნიკა",
  "სოფო",
  "თამარ",
  "ირაკლი",
  "კეთევან",
  "დავით",
  "ელენე",
  "ზურაბ",
];

const GUESTBOOK_TEXT = [
  "გილოცავთ! ყველაზე ლამაზი წყვილი ხართ 💕",
  "საუკუთრეს ბედნიერებას გისურვებთ ✨",
  "მადლობა ულამაზეს საღამოსთვის!",
  "ღვთის ნამტვრები ხართ — მემენტო forever 📸",
  "ვაუჰ, რა ემოციები იყო!",
];

async function upsertUser(email: string, name: string, role: string) {
  return prisma.user.upsert({
    where: { email },
    create: { email, name, role, emailVerified: new Date() },
    update: { name, role, emailVerified: new Date() },
  });
}

async function seedPartners() {
  const orgBySlug = new Map<string, string>();
  for (const p of PARTNERS) {
    const user = await upsertUser(p.email, p.userName, "partner");
    const org = await prisma.partnerOrg.upsert({
      where: { slug: p.slug },
      create: {
        name: p.name,
        slug: p.slug,
        primaryColor: p.primaryColor,
        secondaryColor: p.secondaryColor,
        creditsBalance: p.credits,
        commissionRate: p.commissionRate,
        whiteLabel: true,
        logoUrl: `/seed-branding/${p.slug}.svg`,
      },
      update: {
        name: p.name,
        primaryColor: p.primaryColor,
        secondaryColor: p.secondaryColor,
        creditsBalance: p.credits,
        commissionRate: p.commissionRate,
        whiteLabel: true,
      },
    });
    await prisma.partnerMember.upsert({
      where: { partnerId_userId: { partnerId: org.id, userId: user.id } },
      create: { partnerId: org.id, userId: user.id, role: "owner" },
      update: {},
    });
    await prisma.partnerSubscription.upsert({
      where: { partnerId: org.id },
      create: {
        partnerId: org.id,
        planId: "partner_studio",
        status: "active",
        externalProvider: "manual",
        currentPeriodEnd: daysFromNow(90),
      },
      update: {
        status: "active",
        currentPeriodEnd: daysFromNow(90),
      },
    });
    orgBySlug.set(p.slug, org.id);
  }
  return orgBySlug;
}

async function seedEvents(orgBySlug: Map<string, string>) {
  const owners = await Promise.all([
    upsertUser("host.nino@memento.demo", "ნინო მ.", "user"),
    upsertUser("cohost.demo@memento.demo", "თენგიზი თ.", "user"),
  ]);

  const eventIds: { id: string; seed: EventSeed }[] = [];

  for (const e of EVENTS) {
    const partnerOrgId = e.partnerSlug ? orgBySlug.get(e.partnerSlug) : undefined;
    let galleryPasswordHash: string | null = null;
    if (e.galleryPassword) {
      galleryPasswordHash = await bcrypt.hash(e.galleryPassword, 12);
    }

    const event = await prisma.event.upsert({
      where: { guestSlug: e.guestSlug },
      create: {
        guestSlug: e.guestSlug,
        customSlug: e.customSlug,
        hostToken: e.hostToken,
        slideshowToken: e.slideshowToken,
        coupleNames: e.coupleNames,
        eventDate: e.eventDate,
        planTier: e.planTier,
        isPaid: e.isPaid,
        paidAt: e.paidAt,
        expiresAt: e.expiresAt,
        partnerOrgId,
        ownerUserId: owners[0].id,
        disposableEnabled: e.disposableEnabled ?? false,
        shotsPerGuest: e.shotsPerGuest ?? 0,
        revealAt: e.revealAt ?? null,
        moderateUploads: e.moderateUploads ?? false,
        publicGallery: e.publicGallery ?? false,
        galleryPasswordHash,
        brandingPrimary: partnerOrgId ? undefined : undefined,
      },
      update: {
        customSlug: e.customSlug,
        hostToken: e.hostToken,
        slideshowToken: e.slideshowToken,
        coupleNames: e.coupleNames,
        eventDate: e.eventDate,
        planTier: e.planTier,
        isPaid: e.isPaid,
        paidAt: e.paidAt,
        expiresAt: e.expiresAt,
        partnerOrgId,
        disposableEnabled: e.disposableEnabled ?? false,
        shotsPerGuest: e.shotsPerGuest ?? 0,
        revealAt: e.revealAt ?? null,
        moderateUploads: e.moderateUploads ?? false,
        publicGallery: e.publicGallery ?? false,
        galleryPasswordHash,
      },
    });
    eventIds.push({ id: event.id, seed: e });
  }

  const live = eventIds.find((x) => x.seed.guestSlug === "seed-live-ketevan-david");
  if (live) {
    await prisma.eventCoHost.upsert({
      where: { eventId_userId: { eventId: live.id, userId: owners[1].id } },
      create: { eventId: live.id, userId: owners[1].id },
      update: {},
    });
  }

  return eventIds;
}

async function seedMediaForEvents(eventIds: { id: string; seed: EventSeed }[]) {
  const sampleDir = path.join(process.cwd(), "public/seed-samples");
  const files = (await readdir(sampleDir)).filter((f) => f.endsWith(".jpg"));
  if (files.length === 0) throw new Error("Missing public/seed-samples/*.jpg");

  for (const { id: eventId, seed } of eventIds) {
    if (seed.mediaCount === 0) {
      await prisma.media.deleteMany({ where: { eventId } });
      await prisma.event.update({
        where: { id: eventId },
        data: { uploadCount: 0, totalBytes: 0 },
      });
      continue;
    }

    await prisma.media.deleteMany({ where: { eventId } });
    let totalBytes = 0;
    for (let i = 0; i < seed.mediaCount; i++) {
      const file = files[i % files.length];
      const buf = await readFile(path.join(sampleDir, file));
      const mediaId = crypto.randomUUID();
      const key = buildMediaKey(eventId, mediaId, "jpg");
      const thumbKey = `${key.replace(/\.jpg$/, "")}_thumb.jpg`;
      await putObject(key, buf, "image/jpeg");
      await putObject(thumbKey, await processThumbnail(buf), "image/jpeg");
      const status =
        seed.moderateUploads && i % 4 === 0 ? "pending" : "approved";
      await prisma.media.create({
        data: {
          eventId,
          storageKey: key,
          thumbKey,
          mimeType: "image/jpeg",
          size: buf.length,
          guestName: GUEST_NAMES[i % GUEST_NAMES.length],
          guestKey: `guest-${i % 8}`,
          width: 1200,
          height: 1600,
          status,
          highlight: i === 0,
        },
      });
      totalBytes += buf.length;
    }
    await prisma.event.update({
      where: { id: eventId },
      data: { uploadCount: seed.mediaCount, totalBytes },
    });
  }
}

async function seedGuestbook(eventIds: { id: string; seed: EventSeed }[]) {
  const voiceBytes = Buffer.from(
    "UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=",
    "base64",
  );

  for (const { id: eventId, seed } of eventIds) {
    await prisma.guestMessage.deleteMany({ where: { eventId } });
    if (seed.mediaCount === 0) continue;

    for (let i = 0; i < 3; i++) {
      await prisma.guestMessage.create({
        data: {
          eventId,
          guestName: GUEST_NAMES[i],
          body: GUESTBOOK_TEXT[i % GUESTBOOK_TEXT.length],
          type: "text",
          status: "approved",
          createdAt: daysFromNow(-i),
        },
      });
    }

    const audioKey = buildMediaKey(eventId, "guestbook-voice-1", "webm");
    await putObject(audioKey, voiceBytes, "audio/webm");
    await prisma.guestMessage.create({
      data: {
        eventId,
        guestName: "მეურვე",
        body: null,
        audioKey,
        type: "audio",
        status: "approved",
      },
    });
  }
}

async function seedPaymentsAndReferrals(
  eventIds: { id: string; seed: EventSeed }[],
  orgBySlug: Map<string, string>,
) {
  const payer = await upsertUser("billing@memento.demo", "ბილინგი", "user");
  let inv = 1000;

  for (const { id: eventId, seed } of eventIds) {
    const plan = getPlan(seed.planTier);
    const externalId = `seed-pay-${seed.guestSlug}`;
    const existing = await prisma.payment.findFirst({
      where: { externalId },
    });
    const payload = {
      userId: payer.id,
      eventId,
      amountGel: plan.priceGel,
      currency: "GEL",
      provider: seed.isPaid ? "bog" : "manual",
      externalId,
      status: seed.isPaid ? "succeeded" : "pending",
      metadata: JSON.stringify({
        invoiceNo: `INV-2026-${inv++}`,
        lineItem: `${plan.nameEn} · ${seed.coupleNames}`,
        seedTag: SEED_TAG,
      }),
    };
    if (existing) {
      await prisma.payment.update({ where: { id: existing.id }, data: payload });
    } else {
      await prisma.payment.create({ data: payload });
    }

    if (seed.partnerSlug && seed.isPaid) {
      const partnerId = orgBySlug.get(seed.partnerSlug)!;
      await prisma.partnerReferral.upsert({
        where: { eventId },
        create: {
          partnerId,
          eventId,
          commissionGel: Math.round(plan.priceGel * 0.12),
          status: "paid",
        },
        update: {
          commissionGel: Math.round(plan.priceGel * 0.12),
          status: "paid",
        },
      });
    }
  }
}

async function seedPushAndAudit(eventIds: { id: string; seed: EventSeed }[]) {
  const host = await upsertUser("host.nino@memento.demo", "ნინო მ.", "user");
  const live = eventIds.find((e) => e.seed.stateLabel === "live");
  if (live) {
    await prisma.pushSubscription.upsert({
      where: { endpoint: `https://push.example.com/${SEED_TAG}/live` },
      create: {
        eventId: live.id,
        endpoint: `https://push.example.com/${SEED_TAG}/live`,
        p256dh: "seed-p256dh-placeholder-base64",
        auth: "seed-auth-placeholder",
        locale: "ka",
      },
      update: { eventId: live.id },
    });
  }

  await prisma.auditLog.deleteMany({
    where: { metadata: { contains: SEED_TAG } },
  });

  const actions = [
    { action: "seed.full.run", entity: "system", entityId: SEED_TAG },
    { action: "event.paid", entity: "Event", entityId: eventIds[0]?.id },
    { action: "partner.credits.manual", entity: "PartnerOrg", entityId: null },
    { action: "media.approved", entity: "Media", entityId: null },
    { action: "admin.login", entity: "AdminSession", entityId: null },
  ];

  for (const a of actions) {
    await prisma.auditLog.create({
      data: {
        userId: host.id,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        metadata: JSON.stringify({ seedTag: SEED_TAG, note: "seed-full" }),
        createdAt: daysFromNow(-Math.floor(Math.random() * 14)),
      },
    });
  }

  await prisma.usageSnapshot.deleteMany({
    where: { capturedAt: { gte: daysFromNow(-1) } },
  });
  await prisma.usageSnapshot.create({
    data: {
      totalBytes: BigInt(
        eventIds.reduce((s, e) => s + e.seed.mediaCount * 400_000, 0),
      ),
      eventCount: eventIds.length,
      capturedAt: now,
    },
  });

  await prisma.emailOutbox.upsert({
    where: { id: `${SEED_TAG}-email` },
    create: {
      id: `${SEED_TAG}-email`,
      toEmail: "host.nino@memento.demo",
      template: "package_expiry",
      locale: "ka",
      payload: JSON.stringify({
        coupleNames: "ნინო & გიორგი",
        expiresAt: daysFromNow(14).toISOString(),
        hostUrl: "http://localhost:43123/host/demo-host-token-memento-2026",
      }),
      sentAt: daysFromNow(-1),
    },
    update: {
      template: "package_expiry",
      sentAt: daysFromNow(-1),
    },
  });
}

async function main() {
  console.log(`Running ${SEED_TAG}…`);
  const orgBySlug = await seedPartners();
  const eventIds = await seedEvents(orgBySlug);
  await seedMediaForEvents(eventIds);
  await seedGuestbook(eventIds);
  await seedPaymentsAndReferrals(eventIds, orgBySlug);
  await seedPushAndAudit(eventIds);
  await ensureDemoEvent();
  console.log(
    `Seed complete: ${PARTNERS.length} partners, ${eventIds.length} events, media & guestbook refreshed.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
