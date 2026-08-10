import { NextResponse } from "next/server";
import { createSubmission } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const userId = Number(body.userId);
    const username = String(body.username ?? "").trim();
    const durationMs = Number(body.durationMs);
    const institution = String(body.institution ?? "").trim();
    const projectTitle = String(body.projectTitle ?? "").trim();
    const domain = String(body.domain ?? "").trim();
    const subdomain = String(body.subdomain ?? "").trim();

    if (!userId || !username || !institution || !projectTitle || !domain || !subdomain) {
      return NextResponse.json(
        { error: "Date incomplete pentru depunere." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(durationMs) || durationMs < 0) {
      return NextResponse.json(
        { error: "Timpul de completare este invalid." },
        { status: 400 }
      );
    }

    const county = String(body.county ?? "").trim();
    const locality = String(body.locality ?? "").trim();

    const result = await createSubmission({
      userId,
      username,
      durationMs,
      institution,
      projectTitle,
      domain,
      subdomain,
      county,
      locality,
    });

    return NextResponse.json({ ok: true, appNumber: result.appNumber });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nu am putut salva depunerea." },
      { status: 500 }
    );
  }
}
