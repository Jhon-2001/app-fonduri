import { NextResponse } from "next/server";
import { getApplications, getLeaderboard } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const county = searchParams.get("county") ?? undefined;
    const domain = searchParams.get("domain") ?? undefined;
    const top = searchParams.get("top") === "1";

    if (top) {
      const rows = await getLeaderboard(10);
      return NextResponse.json({ rows });
    }

    const rows = await getApplications({
      q: q || undefined,
      county: county || undefined,
      domain: domain || undefined,
    });
    return NextResponse.json({ rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nu am putut încărca aplicațiile." },
      { status: 500 }
    );
  }
}
