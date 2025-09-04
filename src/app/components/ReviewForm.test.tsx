import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReviewForm from "./ReviewForm";
import { describe, it, expect, vi } from "vitest";

describe("ReviewForm", () => {
  it("permite enviar una reseña", () => {
    const mockOnSubmit = vi.fn();
    render(<ReviewForm bookId="123" onSubmit={mockOnSubmit} />);

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "3" } });
    fireEvent.change(screen.getByPlaceholderText("Escribe tu reseña..."), {
      target: { value: "Muy buen libro" },
    });
    fireEvent.click(screen.getByText("Enviar reseña"));

    expect(mockOnSubmit).toHaveBeenCalledWith("123", 3, "Muy buen libro");
  });
});