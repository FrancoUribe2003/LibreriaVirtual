import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

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

  const { bookId, rating, text } = await req.json();
  if (!bookId || !rating || !text) {
    return NextResponse.json({ ok: false, error: "Datos faltantes" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const user = await db.collection("users").findOne({ _id: new ObjectId(payload.userId) });

  if (!user) {
    return NextResponse.json({ ok: false, error: "Usuario no encontrado" }, { status: 404 });
  }

  const review = {
    bookId,
    userId: payload.userId,
    userName: user.name,
    content: text,
    rating,
    createdAt: new Date(),
  };

  await db.collection("reviews").insertOne(review);

  return NextResponse.json({ ok: true, review });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bookId = url.searchParams.get("bookId");
  if (!bookId) {
    return NextResponse.json({ ok: false, error: "Falta bookId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();
  const reviews = await db.collection("reviews")
    .find({ bookId })
    .sort({ createdAt: -1 })
    .toArray();

  const reviewsWithStringId = reviews.map(r => ({ ...r, userId: r.userId.toString() }));

  return NextResponse.json({ ok: true, reviews: reviewsWithStringId });
}

export async function PATCH(req: Request) {
  const cookie = req.headers.get("cookie");
  const token = cookie?.split("session=")[1]?.split(";")[0];
  if (!token) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
  } catch {
    return NextResponse.json({ ok: false, error: "Token inválido" }, { status: 401 });
  }

  const { reviewId, rating, text } = await req.json();
  if (!reviewId || !rating || !text) {
    return NextResponse.json({ ok: false, error: "Datos faltantes" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Solo permite editar si es el autor
  const review = await db.collection("reviews").findOne({ _id: new ObjectId(reviewId) });
  if (!review || review.userId !== payload.userId) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  await db.collection("reviews").updateOne(
    { _id: new ObjectId(reviewId) },
    { $set: { rating, content: text } }
  );

  return NextResponse.json({ ok: true });
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

  const { reviewId } = await req.json();
  if (!reviewId) {
    return NextResponse.json({ ok: false, error: "Falta reviewId" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db();

  // Solo permite eliminar si es el autor
  const review = await db.collection("reviews").findOne({ _id: new ObjectId(reviewId) });
  if (!review || review.userId !== payload.userId) {
    return NextResponse.json({ ok: false, error: "No autorizado" }, { status: 403 });
  }

  await db.collection("reviews").deleteOne({ _id: new ObjectId(reviewId) });

  return NextResponse.json({ ok: true });
}