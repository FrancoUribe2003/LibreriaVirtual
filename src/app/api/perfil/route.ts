import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("session=")[1]?.split(";")[0];

  if (!token) {
    return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const client = await clientPromise;
    const db = client.db();
    const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) });

    if (!user) {
      return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      user: { name: user.name, email: user.email },
      userId: user._id.toString()
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
  }
}