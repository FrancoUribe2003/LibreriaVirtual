"use client";
import React, { useEffect, useState } from "react";
import { searchBooks } from "./api/searchBooks";
import BookCard from "./components/BookCard";
import type { Book } from "./components/BookCard";
import LogoutButton from "./components/logoutButton";
import PerfilButton from "./components/perfilButton";
import { useRouter } from "next/navigation";

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: { thumbnail?: string };
  };
}

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("title");
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState<{ [bookId: string]: any[] }>({});
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    fetch("/api/perfil")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.userId) setUserId(data.userId);
      });
  }, []);

  const fetchReviews = async (bookId: string) => {
    const res = await fetch(`/api/reviews?bookId=${bookId}`);
    const data = await res.json();
    if (data.ok) {
      setReviews((prev) => ({ ...prev, [bookId]: data.reviews }));
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const results = await searchBooks(query, searchType);
    const mappedBooks: Book[] = results.map((item: GoogleBookItem) => ({
      id: item.id,
      title: item.volumeInfo.title,
      authors: item.volumeInfo.authors,
      description: item.volumeInfo.description,
      imageLinks: item.volumeInfo.imageLinks,
    }));
    setBooks(mappedBooks);
    setLoading(false);

    // Buscar reseñas para cada libro
    mappedBooks.forEach((book) => fetchReviews(book.id));
  };

  const handleAddReview = async (bookId: string, rating: number, text: string) => {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookId, rating, text }),
    });
    const data = await res.json();
    if (data.ok) {
      fetchReviews(bookId);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Bienvenido a la Librería Argentina Virtual
      </h1>
      <form
        className="w-full max-w-md flex flex-col items-center"
        onSubmit={handleSearch}
      >
        <select
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
          className="mb-4 px-4 py-2 border rounded-lg"
        >
          <option value="title">Título</option>
          <option value="author">Autor</option>
          <option value="isbn">ISBN</option>
        </select>
        <input
          type="text"
          name="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar libros..."
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Buscar
        </button>
      </form>
      {loading && <p className="mt-6">Buscando...</p>}
      <div className="w-full max-w-2xl mt-8 grid gap-6">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            reviews={reviews[book.id] || []}
            onAddReview={handleAddReview}
            currentUserId={userId}
            refreshReviews={() => fetchReviews(book.id)}
          />
        ))}
      </div>
      <LogoutButton />
      <PerfilButton />
    </div>
  );
}
