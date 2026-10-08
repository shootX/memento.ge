import { getEventBySlideshowToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signMediaAccess } from "@/lib/crypto";
import { jsonError } from "@/lib/api-utils";

type Params = { params: Promise<{ token: string }> };

export async function GET(req: Request, { params }: Params) {
  const { token } = await params;
  const event = await getEventBySlideshowToken(token);
  if (!event) return jsonError(404, "Not found");

  const encoder = new TextEncoder();
  let lastSeen = new Date(0);

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      const poll = async () => {
        const newItems = await prisma.media.findMany({
          where: {
            eventId: event.id,
            status: "approved",
            createdAt: { gt: lastSeen },
          },
          orderBy: { createdAt: "asc" },
        });
        if (newItems.length > 0) {
          lastSeen = newItems[newItems.length - 1]!.createdAt;
          const exp = Date.now() + 3600_000;
          for (const m of newItems) {
            send({
              type: "new",
              id: m.id,
              mimeType: m.mimeType,
              guestName: m.guestName,
              url: `/api/media/${m.id}?token=${encodeURIComponent(signMediaAccess(m.id, exp))}`,
            });
          }
        }
      };

      await poll();
      const interval = setInterval(() => {
        void poll().catch(() => clearInterval(interval));
      }, 2500);

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
