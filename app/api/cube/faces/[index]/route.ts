import { NextResponse } from "next/server";
import { updateCubeFace } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ index: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { index } = await context.params;
    const faceIndex = Number(index);

    if (!Number.isInteger(faceIndex) || faceIndex < 0 || faceIndex > 5) {
      return NextResponse.json({ error: "Invalid face index" }, { status: 400 });
    }

    const { getCubeState } = await import("@/lib/cube-db");
    const cube = await getCubeState();

    return NextResponse.json({
      faceIndex,
      label: ["Right", "Left", "Top", "Bottom", "Front", "Back"][faceIndex],
      face: cube.faces[faceIndex],
      settings: cube.settings,
    });
  } catch (error) {
    console.error("[api/cube/faces GET]", error);
    return NextResponse.json({ error: "Failed to load face" }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { index } = await context.params;
    const faceIndex = Number(index);

    if (!Number.isInteger(faceIndex) || faceIndex < 0 || faceIndex > 5) {
      return NextResponse.json({ error: "Invalid face index" }, { status: 400 });
    }

    const body = await request.json();
    const cube = await updateCubeFace(faceIndex, body);

    return NextResponse.json({
      faceIndex,
      face: cube.faces[faceIndex],
      cube,
    });
  } catch (error) {
    console.error("[api/cube/faces PATCH]", error);
    return NextResponse.json({ error: "Failed to update face" }, { status: 500 });
  }
}
