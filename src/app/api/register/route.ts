import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  const body = await req.json();

  // Validar los datos con Zod
  const result = registerSchema.safeParse(body);

  if (!result.success) {
    return NextResponse.json(
      { ok: false, error: "Datos inválidos", details: result.error.issues },
      { status: 400 }
    );
  }

  const { name, email, password } = result.data;

  const client = await clientPromise;
  const db = client.db();
  const existing = await db.collection("users").findOne({ email });

  if (existing) {
    return NextResponse.json({ ok: false, error: "El email ya está registrado" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const resultDb = await db.collection("users").insertOne({
    name,
    email,
    password: passwordHash,
    createdAt: new Date(),
  });

  return NextResponse.json({ ok: true, userId: resultDb.insertedId });
}