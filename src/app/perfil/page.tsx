"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ReviewFrontend } from "@/lib/models/ReviewFrontend";
import { FavoriteFrontend } from "@/lib/models/FavoriteFrontend";

export default function PerfilPage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [userReviews, setUserReviews] = useState<ReviewFrontend[]>([]);
  const [favorites, setFavorites] = useState<FavoriteFrontend[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/perfil")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.userId) setUserId(data.userId);
        if (data.ok && data.user) setUser(data.user);
      });
  }, []);

  useEffect(() => {
    async function fetchReviewsWithTitles() {
      if (userId) {
        const res = await fetch(`/api/reviews?userId=${userId}`);
        const data = await res.json();
        if (data.ok) {
          const reviewsWithTitles: ReviewFrontend[] = await Promise.all(
            data.reviews.map(async (review: ReviewFrontend) => {
              try {
                const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes/${review.bookId}`);
                const bookData = await bookRes.json();
                return {
                  ...review,
                  bookTitle: bookData.volumeInfo?.title || "",
                };
              } catch {
                return {
                  ...review,
                  bookTitle: "",
                };
              }
            })
          );
          setUserReviews(reviewsWithTitles);
        }
      }
    }
    fetchReviewsWithTitles();
  }, [userId]);

  useEffect(() => {
    async function fetchFavoritesWithTitles() {
      const res = await fetch("/api/favorites");
      const data = await res.json();
      if (data.ok && Array.isArray(data.favorites)) {
        const favsWithTitles = await Promise.all(
          data.favorites.map(async (bookId: string) => {
            try {
              const bookRes = await fetch(`https://www.googleapis.com/books/v1/volumes/${bookId}`);
              const bookData = await bookRes.json();
              return { id: bookId, title: bookData.volumeInfo?.title || bookId };
            } catch {
              return { id: bookId, title: bookId };
            }
          })
        );
        setFavorites(favsWithTitles);
      }
    }
    if (userId) fetchFavoritesWithTitles();
  }, [userId]);

  const handleRemoveFavorite = async (bookId: string) => {
    await fetch("/api/favorites", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId }),
    });
    setFavorites(favorites.filter(fav => fav.id !== bookId));
  };

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-8 bg-black">
      {/* Botón arriba a la izquierda */}
      <button
        className="absolute top-6 left-6 px-4 py-2 border border-white bg-black text-white rounded hover:bg-white hover:text-black transition"
        onClick={() => router.back()}
      >
        ← Volver atrás
      </button>
      <h1 className="text-2xl mb-6 text-white">Perfil de Usuario</h1>
      {user ? (
        <div className="bg-black border border-white p-6 rounded-lg shadow text-white w-full max-w-sm mb-8">
          <p className="mb-2"><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
      ) : (
        <p className="text-white">Cargando datos...</p>
      )}
      <div className="w-full max-w-lg mb-8">
        <h2 className="text-lg text-white mb-4">Mis favoritos</h2>
        {favorites.length === 0 ? (
          <p className="text-gray-400">No tienes favoritos aún.</p>
        ) : (
          favorites.map((fav, idx) => (
            <div key={idx} className="border rounded p-2 mb-2 bg-black text-white flex justify-between items-center">
              <p className="text-xs text-gray-400">Libro: {fav.title}</p>
              <button
                className="ml-4 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition"
                onClick={() => handleRemoveFavorite(fav.id)}
              >
                -
              </button>
            </div>
          ))
        )}
      </div>
      <div className="w-full max-w-lg">
        <h2 className="text-lg text-white mb-4">Mis reseñas</h2>
        {userReviews.length === 0 ? (
          <p className="text-gray-400">No has escrito reseñas aún.</p>
        ) : (
          userReviews.map((review, idx) => (
            <div key={idx} className="border rounded p-2 mb-2 bg-black text-white">
              <span>{"⭐".repeat(review.rating)}</span>
              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-gray-400">Libro: {review.bookTitle}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}