import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("../actions/reviews", () => ({
  addReview: vi.fn(),
}));

import ReviewFormClient from "./ReviewFormClient";

describe("ReviewFormClient", () => {
  it("renderiza el formulario de reseña", () => {
    render(<ReviewFormClient bookId="book123" />);
    
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/reseña/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /agregar reseña/i })).toBeInTheDocument();
  });

  it("permite seleccionar calificación", () => {
    render(<ReviewFormClient bookId="book123" />);
    
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "3" } });
    
    expect(select).toHaveValue("3");
  });

  it("permite escribir contenido de la reseña", () => {
    render(<ReviewFormClient bookId="book123" />);
    
    const textarea = screen.getByPlaceholderText(/reseña/i) as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: "Gran libro!" } });
    
    expect(textarea.value).toBe("Gran libro!");
  });

  it("valida longitud mínima de 10 caracteres", () => {
    render(<ReviewFormClient bookId="book123" />);
    
    const textarea = screen.getByPlaceholderText(/reseña/i);
    expect(textarea).toHaveAttribute("minLength", "10");
  });
});
