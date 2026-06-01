import { NextResponse } from "next/server";
import {
  getCubeState,
  persistFacesWithUploads,
  saveCubeState,
} from "@/lib/cube-db";
import type { CubeFaceDto } from "@/lib/cube-types";

export const dynamic = "force-dynamic";

function hasPendingUploads(faces: CubeFaceDto[]) {
  return faces.some(
    (face) =>
      face.custom &&
      face.src &&
      (face.src.startsWith("blob:") || face.src.startsWith("data:")),
  );
}

export async function GET() {
  try {
    const cube = await getCubeState();
    return NextResponse.json(cube);
  } catch (error) {
    console.error("[api/cube GET]", error);
    return NextResponse.json(
      { error: "Failed to load cube" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const faces = Array.isArray(body.faces) ? body.faces : [];
    const settings = body.settings ?? {};

    const state = hasPendingUploads(faces)
      ? await persistFacesWithUploads(faces, settings)
      : await saveCubeState(body);

    return NextResponse.json(state);
  } catch (error) {
    console.error("[api/cube PUT]", error);
    return NextResponse.json(
      { error: "Failed to save cube" },
      { status: 500 },
    );
  }
}
