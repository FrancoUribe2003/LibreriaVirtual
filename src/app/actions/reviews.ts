"use server";

import { revalidatePath } from "next/cache";
import clientPromise from "@/lib/mongodb";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";

async function getUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  
  try {
    const decoded = jwt.verify(session, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function addReview(bookId: string, rating: number, text: string) {
  const userId = await getUserId();
  if (!userId) {
    return { ok: false, error: "No autenticado" };
  }

  try {
    const client = await clientPromise;
    const db = client.db();
    
    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    
    await db.collection("reviews").insertOne({
      bookId,
      userId: userId, 
      userName: user?.name || "Usuario",
      rating,
      content: text,
      votes: 0,
      createdAt: new Date(),
    });

    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    console.error("Error al crear reseña:", error);
    return { ok: false, error: "Error al crear reseña" };
  }
}

export async function getReviews(bookId: string) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const reviews = await db.collection("reviews")
      .aggregate([
        { $match: { bookId } },
        {
          $lookup: {
            from: "users",
            localField: "userId",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return reviews.map((r: any) => ({
      _id: r._id.toString(),
      bookId: r.bookId,
      userId: r.userId.toString(),
      userName: r.user?.name || "Usuario",
      content: r.content,
      rating: r.rating,
      votes: r.votes || 0,
    }));
  } catch (error) {
    console.error("Error al obtener reseñas:", error);
    return [];
  }
}