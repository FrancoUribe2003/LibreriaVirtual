import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import BookCard, { Book } from "./BookCard";
import { ReviewFrontend } from "@/lib/models/ReviewFrontend";

const mockBook: Book = {
  id: "abc123",
  title: "El Principito",
  authors: ["Antoine de Saint-Exupéry"],
  description: "Un clásico de la literatura.",
  imageLinks: { thumbnail: "http://example.com/img.jpg" },
};

const mockReviews: ReviewFrontend[] = [
  {
    _id: "r1",
    rating: 5,
    content: "Excelente libro",
    userName: "Franco",
    userId: "user1",
    bookId: "abc123",
  },
  {
    _id: "r2",
    rating: 4,
    content: "Muy bueno",
    userName: "Uribe",
    userId: "user2",
    bookId: "abc123",
  },
];

describe("BookCard", () => {
  it("muestra la información del libro y las reseñas", () => {
    render(
      <BookCard
        book={mockBook}
        reviews={mockReviews}
        onAddReview={vi.fn()}
        currentUserId="user1"
        refreshReviews={vi.fn()}
      />
    );

    expect(screen.getByText("El Principito")).toBeInTheDocument();
    expect(screen.getByText("Antoine de Saint-Exupéry")).toBeInTheDocument();
    expect(screen.getByText(/Un clásico de la literatura/)).toBeInTheDocument();
    expect(screen.getByText("Excelente libro")).toBeInTheDocument();
    expect(screen.getByText("Muy bueno")).toBeInTheDocument();
    expect(screen.getAllByText("⭐".repeat(5))[0]).toBeInTheDocument();
    expect(screen.getAllByText("⭐".repeat(4))[0]).toBeInTheDocument();
  });

  it('muestra el botón "Añadir a favoritos"', () => {
    render(
      <BookCard
        book={mockBook}
        reviews={mockReviews}
        onAddReview={vi.fn()}
        currentUserId="user1"
        refreshReviews={vi.fn()}
      />
    );
    expect(screen.getByText("Añadir a favoritos")).toBeInTheDocument();
  });

  it('muestra los botones "Editar" y "Eliminar" solo para el usuario actual', () => {
    render(
      <BookCard
        book={mockBook}
        reviews={mockReviews}
        onAddReview={vi.fn()}
        currentUserId="user1"
        refreshReviews={vi.fn()}
      />
    );
    expect(screen.getByText("Editar")).toBeInTheDocument();
    expect(screen.getByText("Eliminar")).toBeInTheDocument();
  });

  it('no muestra los botones "Editar" y "Eliminar" para otros usuarios', () => {
    render(
      <BookCard
        book={mockBook}
        reviews={mockReviews}
        onAddReview={vi.fn()}
        currentUserId="user3"
        refreshReviews={vi.fn()}
      />
    );
    expect(screen.queryByText("Editar")).not.toBeInTheDocument();
    expect(screen.queryByText("Eliminar")).not.toBeInTheDocument();
  });
});