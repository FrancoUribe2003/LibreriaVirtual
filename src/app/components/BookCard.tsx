import React, { useState } from "react";
import Image from "next/image";
import ReviewForm from "./ReviewForm";
import { ReviewFrontend } from "@/lib/models/ReviewFrontend";

export interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  imageLinks?: {
  thumbnail?: string;
  };
}

interface BookCardProps {
  book: Book;
  reviews: ReviewFrontend[]; 
  onAddReview: (bookId: string, rating: number, text: string) => void;
  currentUserId: string;
  refreshReviews: () => void;
}

export default function BookCard({ book, reviews, onAddReview, currentUserId, refreshReviews }: BookCardProps) {
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editRating, setEditRating] = useState(5);
  const [isFavorite, setIsFavorite] = useState(false);

  const handleEdit = (review: ReviewFrontend) => {
    setEditingReviewId(review._id);
    setEditText(review.content);
    setEditRating(review.rating);
  };

  const handleSaveEdit = async (reviewId: string) => {
    await fetch("/api/reviews", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId, rating: editRating, text: editText }),
    });
    setEditingReviewId(null);
    refreshReviews(); 
  };

  const handleDelete = async (reviewId: string) => {
    await fetch("/api/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId }),
    });
    refreshReviews(); 
  };

  const handleAddFavorite = async (bookId: string) => {
    await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    setIsFavorite(true);
  };

  return (
    <div className="border rounded-lg p-4 flex gap-4 flex-col">
      {book.imageLinks?.thumbnail && (
        <Image
          src={book.imageLinks.thumbnail}
          alt={book.title}
          width={200}
          height={300}
        />
      )}
      <div>
        <h2 className="font-semibold flex items-center gap-4">
          {book.title}
          <button
            className={`px-3 py-1 rounded transition ${isFavorite ? "bg-green-500 text-white" : "bg-yellow-500 text-black hover:bg-yellow-600"}`}
            onClick={() => handleAddFavorite(book.id)}
          >
            {isFavorite ? "Favorito" : "Añadir a favoritos"}
          </button>
        </h2>
        <p className="text-sm text-gray-600">
          {book.authors?.join(", ")}
        </p>
        <p className="text-xs mt-2">
          {book.description?.slice(0, 120)}...
        </p>
      </div>
      <ReviewForm
        bookId={book.id}
        onSubmit={onAddReview}
      />
      <div className="mt-2">
        {(reviews || []).map((review, idx) => {
          return (
            <div key={idx} className="border rounded p-2 mb-2 bg-black text-white relative">
              <span>{"⭐".repeat(review.rating)}</span>
              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-gray-400">Por: {review.userName}</p>
              {/* DEBUG: Mostrar si la condición se cumple */}
              {review.userId === currentUserId && (
                <div className="absolute right-2 bottom-2 flex gap-2">
                  <button
                    className="text-blue-400 underline text-xs"
                    onClick={() => handleEdit(review)}
                  >
                    Editar
                  </button>
                  <button
                    className="text-red-400 underline text-xs"
                    onClick={() => handleDelete(review._id)}
                  >
                    Eliminar
                  </button>
                </div>
              )}
              {/* Formulario de edición */}
              {editingReviewId === review._id && (
                <div className="mt-2 bg-gray-900 p-2 rounded">
                  <select
                    value={editRating}
                    onChange={e => setEditRating(Number(e.target.value))}
                    className="border rounded px-2 py-1 bg-black text-yellow-400"
                  >
                    <option value={1}>⭐</option>
                    <option value={2}>⭐⭐</option>
                    <option value={3}>⭐⭐⭐</option>
                    <option value={4}>⭐⭐⭐⭐</option>
                    <option value={5}>⭐⭐⭐⭐⭐</option>
                  </select>
                  <textarea
                    value={editText}
                    onChange={e => setEditText(e.target.value)}
                    className="border rounded px-2 py-1 bg-black text-white mt-2"
                    rows={2}
                  />
                  <button
                    className="bg-green-600 text-white px-4 py-1 rounded mt-2"
                    onClick={() => handleSaveEdit(review._id)}
                  >
                    Guardar
                  </button>
                  <button
                    className="bg-gray-600 text-white px-4 py-1 rounded mt-2 ml-2"
                    onClick={() => setEditingReviewId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-4 mb-2">
        <label>
          Calificación:
          <select
            className="ml-2 border rounded px-2 py-1 bg-black text-yellow-400 focus:outline-none"
            value={editRating}
            onChange={e => setEditRating(Number(e.target.value))}
          >
            <option value={1}>⭐</option>
            <option value={2}>⭐⭐</option>
            <option value={3}>⭐⭐⭐</option>
            <option value={4}>⭐⭐⭐⭐</option>
            <option value={5}>⭐⭐⭐⭐⭐</option>
          </select>
        </label>
      </div>
    </div>
  );
}