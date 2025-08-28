"use client";
import React, { useState } from "react";

interface Props {
  bookId: string;
  onSubmit: (rating: number, text: string) => void;
}

export default function ReviewForm({ bookId, onSubmit }: Props) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(rating, text);
    setRating(5);
    setText("");
  };

  return (
    <form className="mt-4 flex flex-col gap-2" onSubmit={handleSubmit}>
      <label>
        Calificación:
        <select
          className="ml-2 border rounded px-2 py-1"
          value={rating}
          onChange={e => setRating(Number(e.target.value))}
        >
          <option value={1}>⭐</option>
          <option value={2}>⭐⭐</option>
          <option value={3}>⭐⭐⭐</option>
          <option value={4}>⭐⭐⭐⭐</option>
          <option value={5}>⭐⭐⭐⭐⭐</option>
        </select>
      </label>
      <textarea
        className="border rounded px-2 py-1"
        placeholder="Escribe tu reseña..."
        rows={2}
        value={text}
        onChange={e => setText(e.target.value)}
      />
      <button
        type="submit"
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        Enviar reseña
      </button>
    </form>
  );
}