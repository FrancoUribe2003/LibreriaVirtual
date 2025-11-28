import React from "react";
import Image from "next/image";
import ReviewFormClient from "./ReviewFormClient";
import VoteButtons from "./VoteButtons";
import FavoriteButton from "./FavoriteButton";
import ReviewActions from "./ReviewActions";
import { ReviewFrontend } from "@/lib/models/ReviewFrontend";
import { addReview } from "../actions/reviews";

export interface Book {
  id: string;
  title: string;
  authors?: string[];
  description?: string;
  imageLinks?: { thumbnail?: string };
}

interface BookCardProps {
  book: Book;
  reviews: ReviewFrontend[];
  currentUserId: string;
}

export default function BookCard({ book, reviews, currentUserId }: BookCardProps) {
  // Calcular promedio de calificaciones
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const sortedReviews = [...reviews].sort((a, b) => b.votes - a.votes);

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
        {reviews.length > 0 && (
          <p className="text-sm text-yellow-600 mt-1">
            ⭐ {averageRating.toFixed(1)} • {reviews.length} reseñas
          </p>
        )}
        <p className="text-xs mt-2">
          {book.description?.slice(0, 120)}...
        </p>
      </div>

      <FavoriteButton bookId={book.id} />

      <ReviewFormClient bookId={book.id} />

      <div className="mt-2">
        {sortedReviews.map((review) => {
          const isOwnReview = review.userId === currentUserId;
          
          return (
            <div key={review._id} className="border rounded p-2 mb-2 bg-black text-white">
              <span>{"⭐".repeat(review.rating)}</span>
              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-gray-400">Por: {review.userName}</p>
              
              {!isOwnReview && (
                <div className="mt-2">
                  <VoteButtons
                    reviewId={review._id}
                    initialVotes={review.votes || 0}
                    isOwnReview={isOwnReview}
                  />
                </div>
              )}
              
              {isOwnReview && (
                <ReviewActions
                  reviewId={review._id}
                  initialRating={review.rating}
                  initialContent={review.content}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}