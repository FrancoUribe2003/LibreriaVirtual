"use server";

const reviewsStore: { [bookId: string]: { rating: number; text: string }[] } = {};

export async function addReview(formData: FormData) {
  const bookId = formData.get("bookId") as string;
  const rating = Number(formData.get("rating"));
  const text = formData.get("text") as string;

  if (!bookId || !rating || !text) return;

  if (!reviewsStore[bookId]) reviewsStore[bookId] = [];
  reviewsStore[bookId].push({ rating, text });
}

export async function getReviews(bookId: string) {
  return reviewsStore[bookId] || [];
}