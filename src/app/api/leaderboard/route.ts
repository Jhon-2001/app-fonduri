import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getLeaderboard(10);
    return NextResponse.json({ rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nu am putut încărca clasamentul." },
      { status: 500 }
    );
  }
}
