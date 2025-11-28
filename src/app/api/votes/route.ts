import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import Vote from "@/lib/models/Vote";
import Review from "@/lib/models/Review";
import { voteSchema } from "@/lib/validations";

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";

async function getUserFromCookies() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
    };
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    // Verificar autenticación
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Debes estar autenticado para votar" },
        { status: 401 }
      );
    }

    const body = await req.json();

    // Validar datos
    const validation = voteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: "Datos inválidos", details: validation.error.issues },
        { status: 400 }
      );
    }

    const { reviewId, value } = validation.data;

    // Verificar que la reseña existe
    const review = await Review.findById(reviewId);
    if (!review) {
      return NextResponse.json(
        { ok: false, error: "Reseña no encontrada" },
        { status: 404 }
      );
    }

    // No puedes votar tu propia reseña
    if (review.userId.toString() === user.userId) {
      return NextResponse.json(
        { ok: false, error: "No puedes votar tu propia reseña" },
        { status: 403 }
      );
    }

    // Buscar voto existente del usuario en esta reseña
    const existingVote = await Vote.findOne({
      reviewId,
      userId: user.userId,
    });

    let voteChange = 0;

    if (existingVote) {
      // Si ya votó
      if (existingVote.value === value) {
        // Mismo voto → QUITAR voto
        await Vote.findByIdAndDelete(existingVote._id);
        voteChange = -value; // Restar el voto anterior
      } else {
        // Voto diferente → CAMBIAR voto
        existingVote.value = value;
        await existingVote.save();
        voteChange = value * 2; // Cambio de -1 a 1 = +2, o de 1 a -1 = -2
      }
    } else {
      // No había votado → CREAR voto
      await Vote.create({
        reviewId,
        userId: user.userId,
        value,
      });
      voteChange = value;
    }

    // Actualizar total de votos en la reseña
    review.votes = (review.votes || 0) + voteChange;
    await review.save();

    return NextResponse.json({
      ok: true,
      review: {
        _id: review._id,
        votes: review.votes,
      },
    });
  } catch (error: any) {
    console.error("Error en POST /api/votes:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Obtener el voto del usuario actual para una reseña
export async function GET(req: Request) {
  try {
    const user = await getUserFromCookies();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
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
      vote: vote ? vote.value : null, // null si no ha votado, 1 o -1 si votó
    });
  } catch (error: any) {
    console.error("Error en GET /api/votes:", error);
    return NextResponse.json(
      { ok: false, error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}