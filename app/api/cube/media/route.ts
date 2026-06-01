import { NextResponse } from "next/server";
import { uploadCubeMedia } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const faceIndexRaw =
      formData.get("faceIndex") ?? new URL(request.url).searchParams.get("faceIndex");

    let faceIndex: number | undefined;
    if (faceIndexRaw !== null && faceIndexRaw !== "") {
      const parsed = Number(faceIndexRaw);
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 5) {
        return NextResponse.json({ error: "Invalid faceIndex" }, { status: 400 });
      }
      faceIndex = parsed;
    }

    const result = await uploadCubeMedia(file, faceIndex);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed";
    console.error("[api/cube/media POST]", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
