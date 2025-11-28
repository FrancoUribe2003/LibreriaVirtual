"use client";
import { useState } from "react";
import VoteButtons from "./VoteButtons";

interface ReviewCardProps {
  review: {
    _id: string;
    content: string;
    rating: number;
    votes: number;
    userId: {
      _id: string;
      name: string;
    };
  };
  currentUserId?: string;
  onUpdate: () => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewCard({
  review,
  currentUserId,
  onUpdate,
  onDelete,
}: ReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(review.content);
  const [editedRating, setEditedRating] = useState(review.rating);

  const isOwnReview = currentUserId === review.userId._id;

  const handleUpdate = async () => {
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: review._id,
          content: editedContent,
          rating: editedRating,
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        alert(data.error || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error al actualizar:", error);
      alert("Error al actualizar la reseña");
    }
  };

  return (
    <div className="border rounded-lg p-4 mb-3 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-gray-800">{review.userId.name}</p>
          <div className="flex items-center gap-1">
            {"⭐".repeat(review.rating)}
            <span className="text-sm text-gray-600">({review.rating}/5)</span>
          </div>
        </div>

        {isOwnReview && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-blue-600 hover:underline text-sm"
            >
              {isEditing ? "Cancelar" : "Editar"}
            </button>
            <button
              onClick={() => onDelete(review._id)}
              className="text-red-600 hover:underline text-sm"
            >
              Eliminar
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full border rounded p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            minLength={10}
          />
          <select
            value={editedRating}
            onChange={(e) => setEditedRating(Number(e.target.value))}
            className="border rounded px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n} ⭐
              </option>
            ))}
          </select>
          <button
            onClick={handleUpdate}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            Guardar Cambios
          </button>
        </div>
      ) : (
        <>
          <p className="text-gray-700 mb-3">{review.content}</p>

          {/* Botones de votación */}
          <VoteButtons
            reviewId={review._id}
            initialVotes={review.votes || 0}
            isOwnReview={isOwnReview}
          />
        </>
      )}
    </div>
  );
}