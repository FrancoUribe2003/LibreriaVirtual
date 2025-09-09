import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Set-Cookie": "session=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax",
      },
    }
  );
}