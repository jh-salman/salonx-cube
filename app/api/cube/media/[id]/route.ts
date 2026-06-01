import { NextResponse } from "next/server";
import { prisma } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const media = await prisma.cubeMedia.findUnique({ where: { id } });

    if (!media) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(media.data), {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Length": String(media.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[api/cube/media GET]", error);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
