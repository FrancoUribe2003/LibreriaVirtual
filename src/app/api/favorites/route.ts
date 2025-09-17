import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

console.log("MONGODB_URI en runtime:", process.env.MONGODB_URI);

export async function POST(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("session=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ ok: false, error: "Falta bookId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection("users").updateOne(
    { _id: new ObjectId(payload.userId) },
    { $addToSet: { favorites: bookId } }
  );

  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("session=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) });

  return NextResponse.json({ ok: true, favorites: user?.favorites || [] });
}

export async function DELETE(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("session=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
  }

  const { bookId } = await req.json();
  if (!bookId) {
    return NextResponse.json({ ok: false, error: "Falta bookId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  await db.collection("users").updateOne(
    { _id: new ObjectId(payload.userId) },
    { $pull: { favorites: bookId } }
  );

  return NextResponse.json({ ok: true });
}