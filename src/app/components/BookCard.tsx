import React from "react";
import Image from "next/image";
import ReviewForm from "./ReviewForm";

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
  reviews: { rating: number; text: string }[];
  onAddReview: (rating: number, text: string) => void;
}

export default function BookCard({ book, reviews, onAddReview }: BookCardProps) {
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
        <h2 className="font-semibold">{book.title}</h2>
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
        {(reviews || []).map((review, idx) => (
          <div key={idx} className="border rounded p-2 mb-2 bg-gray-50">
            <span>{"⭐".repeat(review.rating)}</span>
            <p className="text-sm">{review.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}