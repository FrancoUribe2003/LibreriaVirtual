import React from "react";
import ReviewForm from "./ReviewForm";

interface BookCardProps {
  book: any;
  reviews: { rating: number; text: string }[];
  onAddReview: (rating: number, text: string) => void;
}

export default function BookCard({ book, reviews, onAddReview }: BookCardProps) {
  return (
    <div className="border rounded-lg p-4 flex gap-4 flex-col">
      {book.volumeInfo.imageLinks?.thumbnail && (
        <img
          src={book.volumeInfo.imageLinks.thumbnail}
          alt={book.volumeInfo.title}
          className="w-24 h-auto"
        />
      )}
      <div>
        <h2 className="font-semibold">{book.volumeInfo.title}</h2>
        <p className="text-sm text-gray-600">
          {book.volumeInfo.authors?.join(", ")}
        </p>
        <p className="text-xs mt-2">
          {book.volumeInfo.description?.slice(0, 120)}...
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