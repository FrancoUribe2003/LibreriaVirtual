"use client";
import { useState, useEffect } from "react";

interface VoteButtonsProps {
  reviewId: string;
  initialVotes: number;
  isOwnReview?: boolean; // No puedes votar tu propia reseña
}

export default function VoteButtons({
  reviewId,
  initialVotes,
  isOwnReview = false,
}: VoteButtonsProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [userVote, setUserVote] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Obtener voto actual del usuario
  useEffect(() => {
    const fetchUserVote = async () => {
      try {
        const res = await fetch(`/api/votes?reviewId=${reviewId}`);
        if (res.ok) {
          const data = await res.json();
          setUserVote(data.vote);
        }
      } catch (error) {
        console.error("Error al obtener voto:", error);
      }
    };

    if (!isOwnReview) {
      fetchUserVote();
    }
  }, [reviewId, isOwnReview]);

  const handleVote = async (value: number) => {
    if (isOwnReview || loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, value }),
      });

      if (res.ok) {
        const data = await res.json();
        setVotes(data.review.votes);

        // Actualizar estado del voto del usuario
        if (userVote === value) {
          setUserVote(null); // Quitó el voto
        } else {
          setUserVote(value); // Cambió o agregó voto
        }
      } else {
        const data = await res.json();
        alert(data.error || "Error al votar");
      }
    } catch (error) {
      console.error("Error al votar:", error);
      alert("Error al procesar el voto");
    } finally {
      setLoading(false);
    }
  };

  if (isOwnReview) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <span>👍 {votes >= 0 ? votes : 0}</span>
        <span>👎 {votes < 0 ? Math.abs(votes) : 0}</span>
        <span className="text-xs">(Tu reseña)</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => handleVote(1)}
        disabled={loading}
        className={`px-3 py-1 rounded transition ${
          userVote === 1
            ? "bg-green-600 text-white"
            : "bg-gray-200 hover:bg-green-100 text-gray-700"
        } disabled:opacity-50`}
      >
        👍 Útil
      </button>

      <button
        onClick={() => handleVote(-1)}
        disabled={loading}
        className={`px-3 py-1 rounded transition ${
          userVote === -1
            ? "bg-red-600 text-white"
            : "bg-gray-200 hover:bg-red-100 text-gray-700"
        } disabled:opacity-50`}
      >
        👎 No útil
      </button>

      <span className="text-sm font-medium ml-2">
        {votes > 0 ? `+${votes}` : votes}
      </span>
    </div>
  );
}