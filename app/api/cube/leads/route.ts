import { NextResponse } from "next/server";
import { prisma } from "@/lib/cube-db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const leads = await prisma.cubeLead.findMany({
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(leads);
  } catch (error) {
    console.error("[api/cube/leads GET]", error);
    return NextResponse.json({ error: "Failed to load leads" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { phone?: string; name?: string };
    const phone = String(body.phone ?? "").replace(/\D/g, "");

    if (!phone) {
      return NextResponse.json({ error: "Phone required" }, { status: 400 });
    }

    const name = String(body.name ?? "").trim();

    const lead = await prisma.cubeLead.upsert({
      where: { phone },
      create: { phone, name },
      update: { name: name || undefined },
    });

    return NextResponse.json(lead);
  } catch (error) {
    console.error("[api/cube/leads POST]", error);
    return NextResponse.json({ error: "Failed to save lead" }, { status: 500 });
  }
}
