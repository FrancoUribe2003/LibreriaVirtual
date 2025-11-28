"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchForm() {
  const [query, setQuery] = useState("");
  const [searchType, setSearchType] = useState("title");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/?query=${encodeURIComponent(query)}&type=${searchType}`);
  };

  return (
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
  );
}