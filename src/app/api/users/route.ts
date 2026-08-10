import { NextResponse } from "next/server";
import { upsertUser } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body.username ?? "").trim();

    if (!username || username.length < 2) {
      return NextResponse.json(
        { error: "Numele de utilizator trebuie să aibă cel puțin 2 caractere." },
        { status: 400 }
      );
    }

    if (username.length > 40) {
      return NextResponse.json(
        { error: "Numele de utilizator este prea lung (max. 40 caractere)." },
        { status: 400 }
      );
    }

    const user = await upsertUser(username);
    return NextResponse.json({ user });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Nu am putut salva utilizatorul." },
      { status: 500 }
    );
  }
}
