"use client";
import { useState, useTransition } from "react";
import { addReview } from "../actions/reviews";

export default function ReviewFormClient({ bookId }: { bookId: string }) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (text.length < 10) {
      alert("La reseña debe tener al menos 10 caracteres");
      return;
    }

    startTransition(async () => {
      const result = await addReview(bookId, rating, text);

      if (result.ok) {
        setText("");
        setRating(5);
      } else {
        alert(result.error || "Error al agregar reseña");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border-t pt-2 mt-2">
      <select
        value={rating}
        onChange={(e) => setRating(Number(e.target.value))}
        className="border rounded px-2 py-1 bg-black text-yellow-400"
        disabled={isPending}
      >
        <option value={1}>⭐</option>
        <option value={2}>⭐⭐</option>
        <option value={3}>⭐⭐⭐</option>
        <option value={4}>⭐⭐⭐⭐</option>
        <option value={5}>⭐⭐⭐⭐⭐</option>
      </select>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe tu reseña (mínimo 10 caracteres)..."
        className="w-full border rounded px-2 py-1 mt-2 bg-black text-white"
        rows={3}
        required
        minLength={10}
        disabled={isPending}
      />
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-1 rounded mt-2 hover:bg-blue-700 disabled:bg-gray-500"
        disabled={isPending}
      >
        {isPending ? "Agregando..." : "Agregar Reseña"}
      </button>
    </form>
  );
}