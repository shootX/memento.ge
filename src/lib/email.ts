import { prisma } from "@/lib/prisma";

export async function queueEmail(
  toEmail: string,
  template: string,
  payload: Record<string, unknown>,
) {
  await prisma.emailOutbox.create({
    data: {
      toEmail,
      template,
      payload: JSON.stringify(payload),
    },
  });

  if (process.env.NODE_ENV !== "production") {
    console.info(`[email] ${template} → ${toEmail}`, payload);
  }
}
