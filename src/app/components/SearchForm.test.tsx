import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SearchForm from "./SearchForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe("SearchForm", () => {
  it("renderiza el formulario de búsqueda", () => {
    render(<SearchForm />);
    
    expect(screen.getByPlaceholderText("Buscar libros...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /buscar/i })).toBeInTheDocument();
  });

  it("permite cambiar el tipo de búsqueda", () => {
    render(<SearchForm />);
    
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    
    fireEvent.change(select, { target: { value: "author" } });
    expect(select).toHaveValue("author");
  });

  it("permite escribir en el campo de búsqueda", () => {
    render(<SearchForm />);
    
    const input = screen.getByPlaceholderText("Buscar libros...") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "Harry Potter" } });
    
    expect(input.value).toBe("Harry Potter");
  });
});
