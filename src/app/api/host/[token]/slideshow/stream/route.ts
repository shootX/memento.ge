import { getEventByHostToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const event = await getEventByHostToken(token);
  if (!event) return jsonError(404, "Not found");

  const encoder = new TextEncoder();
  let lastId: string | null = null;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        const latest = await prisma.media.findFirst({
          where: { eventId: event.id },
          orderBy: { createdAt: "desc" },
        });
        if (latest && latest.id !== lastId) {
          lastId = latest.id;
          const exp = Date.now() + 3600_000;
          const mediaToken = signMediaAccess(latest.id, exp);
          send({
            id: latest.id,
            url: `/api/media/${latest.id}?token=${encodeURIComponent(mediaToken)}`,
            mimeType: latest.mimeType,
            guestName: latest.guestName,
          });
        }
      };

      await poll();
      const interval = setInterval(() => {
        void poll().catch(() => clearInterval(interval));
      }, 3000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
