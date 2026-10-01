import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/api-utils";

/**
 * Payment seam for future Bank of Georgia / TBC integration.
 * MVP: returns instructions for manual activation.
 */
const schema = z.object({
  eventId: z.string().min(1),
  planTier: z.enum(["starter", "classic", "premium"]),
});

export async function POST(req: Request) {
  const body = schema.parse(await req.json());
  return NextResponse.json({
    status: "manual",
    eventId: body.eventId,
    planTier: body.planTier,
    message:
      "გადახდის ინტეგრაცია მალე. ახლა გადაიხადეთ ბანკის გადარიცხვით ან WhatsApp-ით და ადმინი აქტივირებს ღონისძიებას.",
    futureProviders: ["bank_of_georgia", "tbc"],
  });
}
