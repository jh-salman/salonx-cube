import { NextResponse } from "next/server";
import { prisma } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_VIDEO_BYTES = 30 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      return NextResponse.json(
        { error: "Only image or video uploads are allowed" },
        { status: 400 },
      );
    }

    const maxBytes = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `File too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)` },
        { status: 400 },
      );
    }

    const data = Buffer.from(await file.arrayBuffer());
    const media = await prisma.cubeMedia.create({
      data: {
        mimeType: file.type || (isVideo ? "video/mp4" : "image/jpeg"),
        data,
        size: data.length,
      },
    });

    return NextResponse.json({
      id: media.id,
      url: `/api/cube/media/${media.id}`,
      mimeType: media.mimeType,
      size: media.size,
    });
  } catch (error) {
    console.error("[api/cube/media POST]", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
