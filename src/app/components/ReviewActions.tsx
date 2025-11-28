"use client";
import { useState } from "react";

interface ReviewActionsProps {
  reviewId: string;
  initialRating: number;
  initialContent: string;
}

export default function ReviewActions({ reviewId, initialRating, initialContent }: ReviewActionsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(initialRating);
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);

  const handleEdit = async () => {
    if (content.length < 10) {
      alert("La reseña debe tener al menos 10 caracteres");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, rating, text: content }),
      });

      if (res.ok) {
        setIsEditing(false);
        window.location.reload(); 
      } else {
        alert("Error al actualizar la reseña");
      }
    } catch (error) {
      alert("Error al actualizar la reseña");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });

      if (res.ok) {
        window.location.reload(); 
      } else {
        alert("Error al eliminar la reseña");
      }
    } catch (error) {
      alert("Error al eliminar la reseña");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <div className="mt-2 space-y-2">
        <select
          value={rating}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border rounded px-2 py-1 bg-black text-yellow-400"
          disabled={loading}
        >
          <option value={1}>⭐</option>
          <option value={2}>⭐⭐</option>
          <option value={3}>⭐⭐⭐</option>
          <option value={4}>⭐⭐⭐⭐</option>
          <option value={5}>⭐⭐⭐⭐⭐</option>
        </select>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full border rounded px-2 py-1 bg-black text-white"
          rows={3}
          minLength={10}
          disabled={loading}
        />
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            disabled={loading}
            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-500"
          >
            {loading ? "Guardando..." : "Guardar"}
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setRating(initialRating);
              setContent(initialContent);
            }}
            disabled={loading}
            className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:bg-gray-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-2 flex gap-2">
      <button
        onClick={() => setIsEditing(true)}
        disabled={loading}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-500 text-sm"
      >
        Editar
      </button>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-500 text-sm"
      >
        {loading ? "..." : "Eliminar"}
      </button>
    </div>
  );
}
