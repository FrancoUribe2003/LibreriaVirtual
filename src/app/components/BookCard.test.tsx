import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import BookCard from "./BookCard";
import { describe, it, expect, vi } from "vitest";

const mockBook = {
  id: "abc123",
  title: "El Principito",
  authors: ["Antoine de Saint-Exupéry"],
  description: "Un clásico de la literatura.",
  imageLinks: { thumbnail: "http://example.com/img.jpg" },
};

const mockReviews = [
  { rating: 5, text: "Excelente libro" },
  { rating: 4, text: "Muy bueno" },
];

describe("BookCard", () => {
  it("muestra la información del libro y las reseñas", () => {
    render(
      <BookCard
        book={mockBook}
        reviews={mockReviews}
        onAddReview={vi.fn()}
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

  it("permite agregar una reseña usando el formulario", () => {
    const mockOnAddReview = vi.fn();
    render(
      <BookCard
        book={mockBook}
        reviews={[]}
        onAddReview={mockOnAddReview}
      />
    );

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("Escribe tu reseña..."), {
      target: { value: "Interesante" },
    });
    fireEvent.click(screen.getByText("Enviar reseña"));

    expect(mockOnAddReview).toHaveBeenCalledWith("abc123", 3, "Interesante");
  });
  //Comentario
});