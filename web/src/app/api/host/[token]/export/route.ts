import { NextResponse } from "next/server";
import { authorizeHostMutation } from "@/lib/host-request-auth";
import { jsonError } from "@/lib/api-utils";
import { enqueueMediaExport } from "@/lib/jobs/media-export";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ token: string }> };

export async function POST(req: Request, { params }: Params) {
  const { token } = await params;
  const auth = await authorizeHostMutation(req, token);
  if (!auth.ok) return jsonError(403, "Invalid CSRF");

  const idem = req.headers.get("Idempotency-Key") ?? undefined;
  const jobId = await enqueueMediaExport(auth.event.id, idem);
  const job = await prisma.mediaExportJob.findUnique({ where: { id: jobId } });
  return NextResponse.json({
    ok: true,
    jobId,
    status: job?.status,
    mediaTotal: job?.mediaTotal,
  });
}
