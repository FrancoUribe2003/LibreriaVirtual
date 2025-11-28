"use client";
import { useState, useEffect } from "react";

interface FavoriteButtonProps {
  bookId: string;
}

export default function FavoriteButton({ bookId }: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Verificar si el libro está en favoritos
    fetch("/api/favorites")
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.favorites)) {
          setIsFavorite(data.favorites.includes(bookId));
        }
      })
      .catch(err => console.error("Error al cargar favoritos:", err));
  }, [bookId]);

  const toggleFavorite = async () => {
    setLoading(true);
    
    try {
      if (isFavorite) {
        // Eliminar de favoritos
        const res = await fetch("/api/favorites", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        
        if (res.ok) {
          setIsFavorite(false);
        }
      } else {
        // Agregar a favoritos
        const res = await fetch("/api/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookId }),
        });
        
        if (res.ok) {
          setIsFavorite(true);
        }
      }
    } catch (error) {
      console.error("Error al actualizar favoritos:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className={`px-4 py-2 rounded-lg transition ${
        isFavorite
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-blue-600 hover:bg-blue-700 text-white"
      } disabled:bg-gray-400`}
    >
      {loading ? "..." : isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
    </button>
  );
}
