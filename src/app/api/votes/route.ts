import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import Vote from "@/lib/models/Vote";
import Review from "@/lib/models/Review";
import { voteSchema } from "@/lib/validations";
import mongoose from "mongoose";

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";
const MONGODB_URI = process.env.MONGODB_URI as string;

async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  await mongoose.connect(MONGODB_URI);
}

async function getUserFromCookies(req: Request) {
  const cookieHeader = req.headers.get("cookie");

  if (!cookieHeader) {
    console.log("❌ No hay cookie header");
    return null;
  }

  const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split("=");
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies.token || cookies.session;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    console.log("✅ Token válido - userId:", decoded.userId);
    return decoded;
  } catch (error) {
    console.error("❌ Error al verificar token:", error);
    return null;
  }
}

export async function POST(req: Request) {
  try {
    console.log("📥 POST /api/votes - Inicio");
    
    await connectDB();
    
    const user = await getUserFromCookies(req);
    
    if (!user) {
      console.log("❌ Usuario no autenticado");
      return NextResponse.json(
        { ok: false, error: "Debes estar autenticado para votar" },
        { status: 401 }
      );
    }    
    const body = await req.json();

    const validation = voteSchema.safeParse(body);
    if (!validation.success) {
      console.log("❌ Validación fallida:", validation.error.issues);
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reviewId, value } = validation.data;

    const review = await Review.findById(reviewId);
    if (!review) {
      console.log("❌ Reseña no encontrada");
      return NextResponse.json(
        { ok: false, error: "Reseña no encontrada" },
        { status: 404 }
      );
    }


    if (review.userId.toString() === user.userId) {
      console.log("❌ Intento de votar propia reseña");
      return NextResponse.json(
        { ok: false, error: "No puedes votar tu propia reseña" },
        { status: 403 }
      );
    }

    const existingVote = await Vote.findOne({
      reviewId,
      userId: user.userId,
    });


    let voteChange = 0;

    if (existingVote) {
      if (existingVote.vote === value) {
        console.log("🔄 Quitando voto");
        await Vote.findByIdAndDelete(existingVote._id);
        voteChange = -value;
      } else {
        console.log("🔄 Cambiando voto de", existingVote.vote, "a", value);
        existingVote.vote = value;
        await existingVote.save();
        voteChange = value * 2;
      }
    } else {
      console.log("➕ Creando nuevo voto");
      await Vote.create({
        reviewId,
        userId: user.userId,
        vote: value, 
      });
      voteChange = value;
    }

    const oldVotes = review.votes || 0;
    review.votes = oldVotes + voteChange;
    await review.save();


    return NextResponse.json({
      ok: true,
      review: {
        _id: review._id,
        votes: review.votes,
      },
    });
  } catch (error: any) {
    console.error("💥 Error en POST /api/votes:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    console.log("📥 GET /api/votes - Inicio");
    
    await connectDB();
    
    const user = await getUserFromCookies(req);
    if (!user) {
      console.log("❌ Usuario no autenticado");
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 }
      );
    }    const { searchParams } = new URL(req.url);
    const reviewId = searchParams.get("reviewId");

    if (!reviewId) {
      return NextResponse.json(
        { ok: false, error: "reviewId es requerido" },
        { status: 400 }
      );
    }

    const vote = await Vote.findOne({
      reviewId,
      userId: user.userId,
    });


    return NextResponse.json({
      ok: true,
      vote: vote ? vote.vote : null,
    });
  } catch (error: any) {
    console.error("💥 Error en GET /api/votes:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}