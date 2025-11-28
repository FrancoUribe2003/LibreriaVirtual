export async function searchBooks(query: string, type: string = "title") {
  if (!query) return [];
  
  let q = "";
  if (type === "title") q = query;
  if (type === "author") q = `inauthor:${query}`;
  if (type === "isbn") q = `isbn:${query}`;
  
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}`,
      { cache: "no-store" }
    );
    
    if (!res.ok) {
      console.error("Error Google Books API:", res.status);
      return [];
    }
    
    const data = await res.json();
    return data.items || [];
  } catch (error) {
    console.error("Error buscando libros:", error);
    return [];
  }
}