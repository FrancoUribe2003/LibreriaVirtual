import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import FavoriteButton from "./FavoriteButton";

global.fetch = vi.fn();

describe("FavoriteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, favorites: [] }),
    });
  });

  it("renderiza el botón de favoritos", async () => {
    render(<FavoriteButton bookId="book123" />);
    
    await screen.findByText(/favoritos/i);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("muestra texto 'Añadir a favoritos' cuando no es favorito", async () => {
    render(<FavoriteButton bookId="book123" />);
    
    const button = await screen.findByText("Añadir a favoritos");
    expect(button).toBeInTheDocument();
  });

  it("muestra texto 'Quitar de favoritos' cuando es favorito", async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ok: true, favorites: ["book123"] }),
    });

    render(<FavoriteButton bookId="book123" />);
    
    const button = await screen.findByText("Quitar de favoritos");
    expect(button).toBeInTheDocument();
  });
});
