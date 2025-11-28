import React from "react";
import { searchBooks } from "./api/searchBooks";
import BookCard from "./components/BookCard";
import SearchForm from "./components/SearchForm";
import LogoutButton from "./components/logoutButton";
import PerfilButton from "./components/perfilButton";
import { getReviews } from "./actions/reviews";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tu-secreto-super-seguro";

interface GoogleBookItem {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    description?: string;
    imageLinks?: {
      thumbnail?: string;
    };
  };
}

async function getCurrentUserId() {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;

  try {
    const decoded = jwt.verify(session, JWT_SECRET) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; type?: string }> ;
}) {
  const params = await searchParams; 
  const query = params.query || "";
  const searchType = params.type || "title";
  const userId = await getCurrentUserId();

  const results: GoogleBookItem[] = query ? await searchBooks(query, searchType) : [];
  
  const books = results.map((item) => ({
    id: item.id,
    title: item.volumeInfo.title,
    authors: item.volumeInfo.authors,
    description: item.volumeInfo.description,
    imageLinks: item.volumeInfo.imageLinks,
  }));

  const booksWithReviews = await Promise.all(
    books.map(async (book) => ({
      ...book,
      reviews: await getReviews(book.id),
    }))
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Bienvenido a la Librería Argentina Virtual
      </h1>
      
      <SearchForm />
      
      {query && booksWithReviews.length === 0 && (
        <p className="mt-6 text-gray-500">
          No se encontraron libros. Intenta otra búsqueda.
        </p>
      )}

      <div className="w-full max-w-2xl mt-8 grid gap-6">
        {booksWithReviews.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            reviews={book.reviews}
            currentUserId={userId || ""}
          />
        ))}
      </div>
      
      <LogoutButton />
      <PerfilButton />
    </div>
  );
}
