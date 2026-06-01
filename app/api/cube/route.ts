import { NextResponse } from "next/server";
import { getCubeState, saveCubeState } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const state = await getCubeState();
    return NextResponse.json(state);
  } catch (error) {
    console.error("[api/cube GET]", error);
    return NextResponse.json(
      { error: "Failed to load cube state" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const state = await saveCubeState(body);
    return NextResponse.json(state);
  } catch (error) {
    console.error("[api/cube PUT]", error);
    return NextResponse.json(
      { error: "Failed to save cube state" },
      { status: 500 },
    );
  }
}
