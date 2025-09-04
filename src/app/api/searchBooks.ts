export async function searchBooks(query: string, type: string = "title") {
  if (!query) return [];
  let q = "";
  if (type === "title") q = query;
  if (type === "author") q = `inauthor:${query}`;
  if (type === "isbn") q = `isbn:${query}`;
  const res = await fetch(
    `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`
  );
  const data = await res.json();
  return data.items || [];
  // comentario para probar el PR
}